import { siteConfig } from '@/constants/siteConfig';
import { ImgHTMLAttributes } from 'react';

export const SITE_LOGO_URL = siteConfig.logoUrl;

export default function ApplicationLogo(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            {...props}
            alt={props.alt ?? siteConfig.name}
            src={props.src ?? SITE_LOGO_URL}
        />
    );
}
