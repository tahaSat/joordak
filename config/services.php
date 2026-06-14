<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'sms' => [
        'api_key' => env('SMS_API_KEY'),
        'template_id' => env('SMS_TEMPLATE_ID'),
        'otp_parameter_name' => env('SMS_OTP_PARAMETER_NAME', 'Code'),
        'delivered_to_post_template_id' => env('SMS_DELIVERED_TO_POST_TEMPLATE_ID', 982417),
    ],

    'zibal' => [
        'merchant' => env('ZIBAL_MERCHANT', env('ZIBAL_MERCHANT_ID')),
        'base_url' => env('ZIBAL_BASE_URL', 'https://gateway.zibal.ir'),
        'start_url' => env('ZIBAL_START_URL', 'https://gateway.zibal.ir/start'),
        'callback_url' => env('ZIBAL_CALLBACK_URL'),
        'timeout' => env('ZIBAL_TIMEOUT', 15),
    ],

];
