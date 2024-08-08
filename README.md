This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Configuration

Configuration is done through environment variables. You can create a `.env` file in the root directory. See the file `app/config.ts` for the list of available environment variables.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## emulating the card reader

per simulare il passaggio della tessera `1234` bisogna mettere un token 
segreto nella variabile d'ambiente `CARD_SECRET_TOKENS` (si possono inserire più tokens separati da una virgola) e poi si può dare il comando
```bash
CODE=codice_tessera
CARD_SECRET_TOKEN=codice_segreto
curl 'http://localhost:3000/graphql' -H "Authorization: ${SECRET_TOKENS}" -H 'content-type: application/json' --data-raw '{"operationName":"Card","variables":{"code":"'"${CODE}"'"},"query":"mutation Card($code: String!) {\n  card(code: $code)\n}"}'
```

## inserting a transaction with an API call

Per automatizzare l'inserimento delle transazioni da altre fonti (ad esempio dai pagamenti di paypal) si può fare una chiamataa alle API 
utilizzando un `token` invece che username e password di amministratore.
Il token (un codice segreto) va inserito nella variabile d'ambiente ADMIN_SECRET_TOKENS (più token possono essere separati da virgola) e quindi si può fare una chiamata come segue:
```bash
ADMIN_SECRET_TOKEN=codice_segreto
email=pippo@email.com
amountCents=100 # centesimi
description="pagamento paypal"
curl "http://localhost:3000/graphql" -H "Authorization: ${ADMIN_SECRET_TOKEN}" -H "content-type: application/json" --data-raw '{"operationName":"SaveTransaction","variables":{"email":"'"${email}"'","amountCents":'"${amountCents}"',"description":"'"${description}"'"},"query":"mutation SaveTransaction($email: String, $amountCents: Int, $description: String) { transaction(email: $email\n amountCents:$amountCents\n  description: $description) }"}'
```


## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## build docker image

```bash
docker build -t dm-coffee/dm-coffee:latest .
```