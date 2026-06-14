<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="utf-8">
    <title>خروجی سفارش‌ها</title>
    <style>
        body {
            font-family: iraniansans, sans-serif;
            font-size: 11px;
            color: #1e293b;
            direction: rtl;
        }

        h1 {
            font-size: 18px;
            font-weight: bold;
            margin: 0 0 6px;
        }

        .meta {
            color: #64748b;
            margin-bottom: 18px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th,
        td {
            border: 1px solid #cbd5e1;
            padding: 8px 6px;
            vertical-align: top;
            text-align: right;
        }

        th {
            background: #f1f5f9;
            font-weight: bold;
        }

        tr:nth-child(even) td {
            background: #f8fafc;
        }

        .ltr {
            direction: ltr;
            unicode-bidi: embed;
            display: inline-block;
        }

        .empty {
            text-align: center;
            color: #64748b;
            padding: 24px;
        }
    </style>
</head>
<body>
    <h1>خروجی سفارش‌ها</h1>
    <p class="meta">تاریخ تهیه: <span class="ltr">{{ $generatedAt }}</span> | تعداد سفارش: <span class="ltr">{{ count($rows) }}</span></p>

    @if (count($rows) === 0)
        <p class="empty">سفارشی با این فیلترها پیدا نشد.</p>
    @else
        <table>
            <thead>
                <tr>
                    <th width="5%">شماره</th>
                    <th width="9%">تاریخ ثبت</th>
                    <th width="10%">وضعیت</th>
                    <th width="9%">مشتری</th>
                    <th width="8%">موبایل</th>
                    <th width="16%">آدرس</th>
                    <th width="6%">کد پستی</th>
                    <th width="22%">محصولات</th>
                    <th width="7%">هزینه ارسال</th>
                    <th width="8%">مبلغ کل</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($rows as $row)
                    <tr>
                        <td><span class="ltr">{{ $row['id'] }}</span></td>
                        <td><span class="ltr">{{ $row['created_at'] }}</span></td>
                        <td>{{ $row['status'] }}</td>
                        <td>{{ $row['customer_name'] }}</td>
                        <td><span class="ltr">{{ $row['customer_phone'] }}</span></td>
                        <td>{{ $row['address'] }}</td>
                        <td><span class="ltr">{{ $row['postal_code'] }}</span></td>
                        <td>{{ $row['products'] }}</td>
                        <td><span class="ltr">{{ $row['shipping_cost'] }}</span></td>
                        <td><span class="ltr">{{ $row['total'] }}</span></td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif
</body>
</html>
