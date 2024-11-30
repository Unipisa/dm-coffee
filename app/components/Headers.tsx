"use client";
import { signOut, useSession } from 'next-auth/react'
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { gql, useQuery } from '@apollo/client';

import package_json from '../../package.json'
import Error from './error'

const GET_PROFILE = gql`
  query GetProfile {
    profile {
      email
      admin
      code
    }
  }`

function classNames(...classes: any) {
  return classes.filter(Boolean).join(' ')
}

export default function Headers() {
    const { data: session } = useSession()
    const { loading, error, data } = useQuery(GET_PROFILE);
    const current_path = window.location.pathname

    if (!session?.user) return <></>  
    if (loading) return <span>...</span>;
    if (error) return <Error error={error} />;

    const isAdmin = data?.profile?.admin;

    const navigation: { name: string, href: string, current: boolean }[] = [
        { name: 'Dashboard', href: '/', current: current_path === '/' },
        // { name: 'Team', href: '#', current: router.pathname === '/team' },
        // { name: 'Projects', href: '#', current: router.pathname === '/projects' },
        // { name: 'Calendar', href: '#', current: router.pathname === '/calendar' },
    ];

    if (isAdmin) {
        navigation.push({ name: 'Admin', href: '/admin', current: current_path === '/admin' });
    }
        
    // see: https://tailwindui.com/components/application-ui/navigation/navbars

    return <Disclosure as="nav" className="bg-gray-200">
        <div className="mx-1">
            dm-coffee
            <span className="mx-1 text-[10px]">
                {package_json.version}
            </span>
        </div>
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
            <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            {/* Mobile menu button*/}
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                <span className="absolute -inset-0.5" />
                <span className="sr-only">Open main menu</span>
                <Bars3Icon aria-hidden="true" className="block size-6 group-data-[open]:hidden" />
                <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-[open]:block" />
            </DisclosureButton>
            </div>
            <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex shrink-0 items-center">
                <span className="h-10 w-auto text-lg">
                    ☕
                </span>
            </div>
            <div className="hidden sm:ml-6 sm:block">
                <div className="flex space-x-4">
                {navigation.map((item) => (
                    <a
                    key={item.name}
                    href={item.href}
                    aria-current={item.current ? 'page' : undefined}
                    className={classNames(
                        item.current ? 'bg-myBlue text-white' : 'text-myBlue-dark hover:text-white',
                        'hover:bg-myBlue-light rounded-md px-3 py-2 text-sm font-medium',
                    )}
                    >
                    {item.name}
                    </a>
                ))}
                </div>
            </div>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            {/* Profile dropdown */}
            <Menu as="div" className="relative ml-3">
                <div>
                <MenuButton className="relative flex rounded-full bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">Open user menu</span>
                    <img
                    alt=""
                    src={session?.user?.image || ""}
                    className="size-8 rounded-full"
                    />
                </MenuButton>
                </div>
                <MenuItems
                transition
                className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                >
                <MenuItem>
                    <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:outline-none"
                    >
                    Settings
                    </a>
                </MenuItem>
                <MenuItem>
                    <a
                        href="#"
                        onClick={() => signOut()}
                        className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:outline-none"
                    >
                    Sign out
                    </a>
                </MenuItem>
                </MenuItems>
            </Menu>
            </div>
        </div>
        </div>

        <DisclosurePanel className="sm:hidden">
        <div className="space-y-1 px-2 pb-3 pt-2">
            {navigation.map((item) => (
            <DisclosureButton
                key={item.name}
                as="a"
                href={item.href}
                aria-current={item.current ? 'page' : undefined}
                className={classNames(
                item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                'block rounded-md px-3 py-2 text-base font-medium',
                )}
            >
                {item.name}
            </DisclosureButton>
            ))}
        </div>
        </DisclosurePanel>
    </Disclosure>
}