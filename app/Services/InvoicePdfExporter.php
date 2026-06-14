<?php

namespace App\Services;

use Mpdf\Config\ConfigVariables;
use Mpdf\Config\FontVariables;
use Mpdf\Mpdf;

class InvoicePdfExporter
{
    /**
     * @param  array<int, array<string, mixed>>  $rows
     */
    public function download(array $rows, string $generatedAt, string $fileName): string
    {
        $mpdf = $this->makeMpdf();

        $html = view('admin.invoices.export', [
            'rows' => $rows,
            'generatedAt' => $generatedAt,
        ])->render();

        $mpdf->WriteHTML($html);

        return $mpdf->Output($fileName, 'S');
    }

    private function makeMpdf(): Mpdf
    {
        $defaultConfig = (new ConfigVariables)->getDefaults();
        $fontDirs = $defaultConfig['fontDir'];
        $fontDirs[] = public_path('fonts/iranian-sans');

        $defaultFontConfig = (new FontVariables)->getDefaults();
        $fontData = $defaultFontConfig['fontdata'];
        $fontData['iraniansans'] = [
            'R' => 'IranianSans-Regular.ttf',
            'B' => 'IranianSans-Bold.ttf',
            'useOTL' => 0xFF,
            'useKashida' => 75,
        ];

        return new Mpdf([
            'mode' => 'utf-8',
            'format' => 'A4-L',
            'tempDir' => storage_path('app/mpdf'),
            'fontDir' => $fontDirs,
            'fontdata' => $fontData,
            'default_font' => 'iraniansans',
            'directionality' => 'rtl',
            'autoScriptToLang' => true,
            'autoLangToFont' => true,
            'margin_left' => 10,
            'margin_right' => 10,
            'margin_top' => 12,
            'margin_bottom' => 12,
        ]);
    }
}
