<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table): void {
            $table->text('address')->nullable()->after('shipping_cost');
        });

        DB::table('invoices')
            ->orderBy('id')
            ->chunkById(100, function ($invoices): void {
                foreach ($invoices as $invoice) {
                    $user = DB::table('users')
                        ->where('id', $invoice->user_id)
                        ->first(['address_province', 'address']);

                    if (! $user) {
                        continue;
                    }

                    DB::table('invoices')
                        ->where('id', $invoice->id)
                        ->update([
                            'address' => User::formatDeliveryAddress($user->address_province, $user->address),
                        ]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table): void {
            $table->dropColumn('address');
        });
    }
};
