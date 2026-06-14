<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table): void {
            $table->string('postal_code')->nullable()->after('address');
        });

        DB::table('invoices')
            ->orderBy('id')
            ->chunkById(100, function ($invoices): void {
                foreach ($invoices as $invoice) {
                    $postalCode = DB::table('users')
                        ->where('id', $invoice->user_id)
                        ->value('postal_code');

                    if ($postalCode === null) {
                        continue;
                    }

                    DB::table('invoices')
                        ->where('id', $invoice->id)
                        ->update(['postal_code' => $postalCode]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table): void {
            $table->dropColumn('postal_code');
        });
    }
};
