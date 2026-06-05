import StorefrontLayout from '@/Layouts/StorefrontLayout';
import type { PageProps } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';

export default function Edit() {
    const user = usePage<PageProps>().props.auth.user!;

    const profileForm = useForm({
        name: user.name,
        surname: user.surname || '',
        email: user.email ?? '',
        phone: user.phone || '',
        address: user.address || '',
        postal_code: user.postal_code || '',
    });

    const submitProfile = (event: FormEvent) => {
        event.preventDefault();
        profileForm.patch(route('profile.update'));
    };

    return (
        <StorefrontLayout title="پروفایل" seo={{ noIndex: true }}>
            <Head title="پروفایل" />

            <div style={{ padding: '48px 0' }}>
                <div style={{ maxWidth: '896px', margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <section style={{ backgroundColor: 'white', padding: '24px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600' }}>اطلاعات پروفایل</h3>
                        <form onSubmit={submitProfile} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
                                <div>
                                    <label htmlFor="name" style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>نام</label>
                                    <input
                                        id="name"
                                        type="text"
                                        value={profileForm.data.name}
                                        onChange={(e) => profileForm.setData('name', e.target.value)}
                                        required
                                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }}
                                    />
                                    {profileForm.errors.name && <p style={{ color: '#c95742', fontSize: '14px', marginTop: '4px' }}>{profileForm.errors.name}</p>}
                                </div>
                                <div>
                                    <label htmlFor="surname" style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>نام خانوادگی</label>
                                    <input
                                        id="surname"
                                        type="text"
                                        value={profileForm.data.surname}
                                        onChange={(e) => profileForm.setData('surname', e.target.value)}
                                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }}
                                    />
                                    {profileForm.errors.surname && <p style={{ color: '#c95742', fontSize: '14px', marginTop: '4px' }}>{profileForm.errors.surname}</p>}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="email" style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>ایمیل</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={profileForm.data.email}
                                    onChange={(e) => profileForm.setData('email', e.target.value)}
                                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }}
                                />
                                {profileForm.errors.email && <p style={{ color: '#c95742', fontSize: '14px', marginTop: '4px' }}>{profileForm.errors.email}</p>}
                            </div>
                            <div>
                                <label htmlFor="phone" style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>شماره تلفن</label>
                                <input
                                    id="phone"
                                    type="tel"
                                    value={profileForm.data.phone}
                                    onChange={(e) => profileForm.setData('phone', e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }}
                                />
                                {profileForm.errors.phone && <p style={{ color: '#c95742', fontSize: '14px', marginTop: '4px' }}>{profileForm.errors.phone}</p>}
                            </div>
                            <div>
                                <label htmlFor="address" style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>آدرس</label>
                                <input
                                    id="address"
                                    type="text"
                                    value={profileForm.data.address}
                                    onChange={(e) => profileForm.setData('address', e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }}
                                />
                                {profileForm.errors.address && <p style={{ color: '#c95742', fontSize: '14px', marginTop: '4px' }}>{profileForm.errors.address}</p>}
                            </div>
                            <div>
                                <label htmlFor="postal_code" style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>کد پستی</label>
                                <input
                                    id="postal_code"
                                    type="text"
                                    value={profileForm.data.postal_code}
                                    onChange={(e) => profileForm.setData('postal_code', e.target.value)}
                                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }}
                                />
                                {profileForm.errors.postal_code && <p style={{ color: '#c95742', fontSize: '14px', marginTop: '4px' }}>{profileForm.errors.postal_code}</p>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <button
                                    type="submit"
                                    disabled={profileForm.processing}
                                    style={{ backgroundColor: '#a9bac9', color: '#c95742', padding: '8px 16px', borderRadius: '6px', fontWeight: '500', cursor: profileForm.processing ? 'not-allowed' : 'pointer', opacity: profileForm.processing ? 0.5 : 1 }}
                                >
                                    ذخیره
                                </button>
                                <Transition
                                    show={profileForm.recentlySuccessful}
                                    enter="transition ease-in-out duration-300"
                                    enterFrom="opacity-0"
                                    leave="transition ease-in-out duration-300"
                                    leaveTo="opacity-0"
                                >
                                    <p style={{ fontSize: '14px', fontWeight: '500', color: '#c95742' }}>
                                        اطلاعات با موفقیت بروز رسانی شد
                                    </p>
                                </Transition>
                            </div>
                        </form>
                    </section>

                </div>
            </div>
        </StorefrontLayout>
    );
}
