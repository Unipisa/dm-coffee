// collect here all the available configuration options for the app
const DATABASE_NAME = process.env.DATABASE_NAME || 'coffee'

let singleton

const config = singleton || (() => {
    const config = {
        ADMINS: process.env.ADMINS || '', // comma separated list of emails
        TOKENS: process.env.TOKENS || '', // comma separated list of tokens for the card reader
        GOOGLE_AUTH_CLIENT_ID: process.env.GOOGLE_AUTH_CLIENT_ID || '',
        GOOGLE_AUTH_CLIENT_SECRET: process.env.GOOGLE_AUTH_CLIENT_SECRET || '',
        DATABASE_NAME,
        DATABASE_URI: process.env.DATABASE_URI || ('mongodb://localhost:27017/' + DATABASE_NAME),
        // the following variables are used by next-auth.
        // they are included here only for reference 
        // since they are extracted directly from 
        // the environment. 
        // Changing them here will have no effect.
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    }

    console.log(` ______   _______         _______  _______  _______  _______  _______  _______ 
(  __  \\ (       )       (  ____ \\(  ___  )(  ____ \\(  ____ \\(  ____ \\(  ____ \\
| (  \\  )| () () |       | (    \\/| (   ) || (    \\/| (    \\/| (    \\/| (    \\/
| |   ) || || || | _____ | |      | |   | || (__    | (__    | (__    | (__    
| |   | || |(_)| |(_____)| |      | |   | ||  __)   |  __)   |  __)   |  __)   
| |   ) || |   | |       | |      | |   | || (      | (      | (      | (      
| (__/  )| )   ( |       | (____/\\| (___) || )      | )      | (____/\\| (____/\\
(______/ |/     \\|       (_______/(_______)|/       |/       (_______/(_______/
`)

    console.log('config loaded: ', 
        Object.fromEntries(Object.entries(config).map(
            ([key, value]) => {
                if (key.toUpperCase().includes('SECRET')) {
                    if (value) value=value.substring(0,2) + '....' + value.substring(value.length-2)
                    }
                return [key, value]
            })))    
    return config
})()

export default config

