<?php

namespace App\Http\Controllers;

use App\Enums\InvoiceStatus;
use App\Enums\PaymentStatus;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\PaymentLifecycleService;
use App\Services\ZibalPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ZibalPaymentController extends Controller
{
    public function pay(
        Request $request,
        Invoice $invoice,
    ): RedirectResponse|Response {
        abort_if($invoice->user_id !== $request->user()->id, 403);

        if (! $invoice->status->canBePaid()) {
            return redirect()->route('invoices.show', $invoice);
        }

        $invoice->load(['items', 'latestPayment']);

        return Inertia::render('Payments/Zibal/Process', [
            'invoice' => $invoice,
        ]);
    }

    public function start(
        Request $request,
        Invoice $invoice,
        ZibalPaymentService $zibal,
        PaymentLifecycleService $lifecycle
    ): JsonResponse {
        abort_if($invoice->user_id !== $request->user()->id, 403);

        if (! $invoice->status->canBePaid()) {
            return response()->json([
                'ok' => false,
                'invoice_status' => $invoice->status->value,
                'redirect_url' => route('invoices.show', $invoice),
                'message' => 'This invoice cannot be paid.',
            ], 422);
        }

        $payment = $this->openPaymentFor($invoice);

        Log::info('Zibal payment initiation requested', [
            'invoice_id' => $invoice->id,
            'payment_id' => $payment->id,
            'user_id' => $request->user()->id,
            'invoice_status' => $invoice->status->value,
            'payment_status' => $payment->status->value,
            'amount' => $payment->amount,
        ]);

        if ($payment->gateway_track_id && $payment->status === PaymentStatus::Processing) {
            Log::info('Zibal payment reusing existing processing track', [
                'invoice_id' => $invoice->id,
                'payment_id' => $payment->id,
                'track_id' => $payment->gateway_track_id,
            ]);

            return $this->gatewayResponse($payment, $zibal);
        }

        try {
            $response = $zibal->requestLazy($payment->loadMissing('user'));

            if (! $zibal->isSuccessfulRequest($response)) {
                $lifecycle->markFailed($payment, $response['message'] ?? 'Zibal did not create a payment session.', verifyPayload: $response);

                return response()->json([
                    'ok' => false,
                    'message' => 'Payment gateway could not start. Please try again.',
                ], 422);
            }

            $payment = $lifecycle->markProcessing($payment, $response);
            Log::info('Zibal payment processing started', [
                'invoice_id' => $invoice->id,
                'payment_id' => $payment->id,
                'track_id' => $payment->gateway_track_id,
                'gateway_order_id' => $payment->gateway_order_id,
            ]);

            return $this->gatewayResponse($payment, $zibal);
        } catch (Throwable $exception) {
            $lifecycle->markFailed($payment, $exception->getMessage());

            report($exception);

            return response()->json([
                'ok' => false,
                'message' => 'Payment gateway is temporarily unavailable. Please try again.',
            ], 503);
        }
    }

    public function callback(
        Request $request,
        ZibalPaymentService $zibal,
        PaymentLifecycleService $lifecycle
    ): JsonResponse|RedirectResponse {
        $payload = $request->all();
        Log::info('Zibal callback received', [
            'method' => $request->method(),
            'payload' => $payload,
        ]);

        $payment = $this->paymentFromCallback($payload);

        if (! $payment) {
            Log::warning('Zibal callback did not match a local payment', [
                'payload' => $payload,
            ]);

            return $this->callbackResponse($request, null, false, 'Payment record was not found.');
        }

        Log::info('Zibal callback matched local payment', [
            'invoice_id' => $payment->invoice_id,
            'payment_id' => $payment->id,
            'track_id' => $payment->gateway_track_id,
            'gateway_order_id' => $payment->gateway_order_id,
            'payment_status' => $payment->status->value,
        ]);

        if ((int) ($payload['success'] ?? 0) !== 1) {
            $lifecycle->markFailed($payment, 'Zibal reported an unsuccessful payment.', $payload);

            return $this->callbackResponse($request, $payment->fresh('invoice'), false, 'Payment was not successful.');
        }

        try {
            $verify = $zibal->verify((string) $payment->gateway_track_id);

            if (! $zibal->isSuccessfulVerification($verify)) {
                $lifecycle->markFailed($payment, $verify['message'] ?? 'Zibal verification failed.', $payload, $verify);

                return $this->callbackResponse($request, $payment->fresh('invoice'), false, 'Payment verification failed.');
            }

            if (! $zibal->amountMatches($payment, $verify)) {
                $lifecycle->markFailed($payment, 'Verified amount does not match invoice amount.', $payload, $verify);

                return $this->callbackResponse($request, $payment->fresh('invoice'), false, 'Payment amount mismatch.');
            }

            $payment = $lifecycle->markPaid($payment, $verify, $payload);

            return $this->callbackResponse($request, $payment->load('invoice'), true, 'پرداخت با موفقیت انجام شد');
        } catch (Throwable $exception) {
            report($exception);

            return $this->callbackResponse($request, $payment->fresh('invoice'), false, 'Payment verification is pending.');
        }
    }

    public function successCallback(
        Request $request,
        Invoice $invoice,
        ZibalPaymentService $zibal,
        PaymentLifecycleService $lifecycle
    ): RedirectResponse {
        $payment = $this->paymentFromCallback($request->all());

        if (! $payment || $payment->invoice_id !== $invoice->id) {
            return redirect()
                ->route('invoices.show', $invoice)
                ->withErrors(['payment' => 'Payment record was not found.']);
        }

        if ((int) $request->input('success', 0) !== 1) {
            $lifecycle->markFailed($payment, 'Zibal reported an unsuccessful payment.', $request->all());

            return redirect()
                ->route('invoices.show', $invoice)
                ->withErrors(['payment' => 'Payment was not successful.']);
        }

        try {
            $verify = $zibal->verify((string) $payment->gateway_track_id);

            if (! $zibal->isSuccessfulVerification($verify)) {
                $lifecycle->markFailed($payment, $verify['message'] ?? 'Zibal verification failed.', $request->all(), $verify);

                return redirect()
                    ->route('invoices.show', $invoice)
                    ->withErrors(['payment' => 'Payment verification failed.']);
            }

            if (! $zibal->amountMatches($payment, $verify)) {
                $lifecycle->markFailed($payment, 'Verified amount does not match invoice amount.', $request->all(), $verify);

                return redirect()
                    ->route('invoices.show', $invoice)
                    ->withErrors(['payment' => 'Payment amount mismatch.']);
            }

            $lifecycle->markPaid($payment, $verify, $request->all());
        } catch (Throwable $exception) {
            report($exception);

            return redirect()
                ->route('invoices.show', $invoice)
                ->withErrors(['payment' => 'Payment verification is pending.']);
        }

        return redirect()->route('payments.zibal.success', $invoice);
    }

    public function success(Request $request, Invoice $invoice): RedirectResponse|Response
    {
        abort_if($invoice->user_id !== $request->user()->id, 403);

        $invoice->load('latestPayment');

        if ($invoice->status !== InvoiceStatus::Paid) {
            return redirect()->route('invoices.show', $invoice);
        }

        return Inertia::render('Payments/Zibal/Success', [
            'invoice' => $invoice,
        ]);
    }

    private function openPaymentFor(Invoice $invoice): Payment
    {
        $payment = $invoice->payments()
            ->whereIn('status', [PaymentStatus::Pending->value, PaymentStatus::Processing->value])
            ->latest()
            ->first();

        if (! $payment) {
            $payment = $invoice->payments()->create([
                'user_id' => $invoice->user_id,
                'gateway' => 'zibal',
                'amount' => $invoice->total,
                'currency' => 'IRR',
                'status' => PaymentStatus::Pending,
            ]);
        }

        if (blank($payment->gateway_order_id)) {
            $payment->forceFill([
                'gateway_order_id' => "invoice-{$invoice->id}-payment-{$payment->id}",
            ])->save();
        }

        return $payment->refresh();
    }

    private function gatewayResponse(Payment $payment, ZibalPaymentService $zibal): JsonResponse
    {
        return response()->json([
            'ok' => true,
            'payment' => [
                'id' => $payment->id,
                'status' => $payment->status->value,
                'gateway_track_id' => $payment->gateway_track_id,
            ],
            'gateway_url' => $zibal->startUrl($payment->gateway_track_id),
        ]);
    }

    private function paymentFromCallback(array $payload): ?Payment
    {
        $trackId = $payload['trackId'] ?? null;
        $orderId = $payload['orderId'] ?? null;

        return Payment::query()
            ->with('invoice')
            ->when($trackId, fn ($query) => $query->where('gateway_track_id', $trackId))
            ->when(! $trackId && $orderId, fn ($query) => $query->where('gateway_order_id', $orderId))
            ->latest()
            ->first();
    }

    private function callbackResponse(Request $request, ?Payment $payment, bool $success, string $message): JsonResponse|RedirectResponse
    {
        if ($request->expectsJson()) {
            return response()->json([
                'ok' => $success,
                'message' => $message,
            ], $payment ? 200 : 404);
        }

        if ($payment?->invoice && auth()->id() === $payment->invoice->user_id) {
            $redirect = $success
                ? redirect()->route('payments.zibal.success', $payment->invoice)
                : redirect()->route('invoices.show', $payment->invoice);
        } else {
            $redirect = redirect()->route('payment-history.index');
        }

        return $success
            ? $redirect
            : $redirect->withErrors(['payment' => $message]);
    }
}
