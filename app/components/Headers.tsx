import { signOut, useSession } from 'next-auth/react'
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Bars3Icon, XMarkIcon, UserIcon } from '@heroicons/react/24/outline'
import { usePathname } from 'next/navigation'

import package_json from '../../package.json'
import {useProfile} from './Provider'

function classNames(...classes: any) {
  return classes.filter(Boolean).join(' ')
}

export default function Headers() {
    const { data: session } = useSession()
    const profile = useProfile()
    const current_path = usePathname()

    const isAdmin = profile?.admin;

    const navigation: { name: string, href: string, current: boolean }[] = [
        { name: 'caffè', href: '/', current: current_path === '/' },
    ]

    if (profile && !profile.code) {
        navigation.push({ name: 'associa tessera', href: '/pairing', current: current_path === '/pairing' })
    }

    if (isAdmin) {
        navigation.push({ name: 'elenco', href: '/admin', current: current_path === '/admin' })
        navigation.push({ name: 'utenti', href: '/admin/users', current: current_path === '/admin/users' })
    }
        
    // see: https://tailwindui.com/components/application-ui/navigation/navbars

    return <Disclosure as="nav" className="bg-gray-100 drop-shadow lg:rounded-b-lg lg:px-4 md:pb-3">
        <div className="mx-1 p-3 lg:px-2 flex items-stretch justify-between space-x-3">
        <div className="flex justify-center sm:hidden">
            <div className="items-center my-2">
            {/* Mobile menu button*/}
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                <span className="-inset-0.5" />
                <span className="sr-only">Open main menu</span>
                <Bars3Icon aria-hidden="true" className="block size-5 group-data-[open]:hidden" />
                <XMarkIcon aria-hidden="true" className="hidden size-5 group-data-[open]:block" />
            </DisclosureButton>
            </div>            
            </div>
            <div className="flex">
                <span className="h-10 w-auto text-3xl mr-2 hidden md:block mt-1">
                    ☕ 
                </span>
                <div className='h-8 mt-1'>
                    <span className='text-[14px] block'>dm-coffee <br></br></span>
                    <span className="text-[10px] block">
                    v{package_json.version}
                </span>
                </div>
                
            </div>
            <div className='flex-1'></div>
            <div className="mt-1">
            {/* Profile dropdown */}
            <Menu as="div" className="mx-1">
                <div>
                <MenuButton className="relative flex rounded-full bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">Open user menu</span>
                    {session?.user?.image 
                        ? <img
                            alt=""
                            src={session.user.image}
                            className="size-10 rounded-full"
                            />
                        : <UserIcon className="size-8 rounded-full" />
                        }
                 {        
                    session?.user?.name && 
                    <div className='align-left'>
                        <p className="text-left pl-2 text-sm m-auto block">{session?.user?.name}</p>
                        <p className="text-left text-gray-700 pl-2 text-sm m-auto block">{session?.user?.email}</p>
                    </div>
                }
                </MenuButton>
                </div>
                <MenuItems
                transition
                className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-0 shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                >
                <MenuItem>{ 
                    session?.user?.email && 
                        <p className="border-b-2 border-gray-500 bg-gray-200 font-bold block px-4 py-2 text-sm">{session?.user?.email}</p>
                }
                </MenuItem>
                <MenuItem>
                    <a
                    href="/pairing"
                    className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:outline-none"
                    >
                        { profile?.code ? `tessera ${profile.code}` : 'associa la tessera' }
                    </a>
                </MenuItem>
                {
                    isAdmin && <>
                        <MenuItem>
                            <a
                                href="/admin/import"
                                className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:outline-none"
                                >
                            importazione
                            </a>
                        </MenuItem>
                        <MenuItem>
                            <a
                                href="/admin/cost"
                                className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:outline-none"
                                >
                            costo unitario
                            </a>
                        </MenuItem>
                    </>
                }
                <MenuItem>
                    <a
                        href="#"
                        onClick={() => signOut()}
                        className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:outline-none"
                    >
                    esci
                    </a>
                </MenuItem>
                </MenuItems>
            </Menu>
            </div>
        </div>
        
        <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <div className="hidden ml-5 sm:block">
                    <div className="flex space-x-2">
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