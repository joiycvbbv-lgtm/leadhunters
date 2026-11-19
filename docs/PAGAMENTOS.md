# Pagamentos do LeadHunter

Este projeto já possui checkout Pix com Mercado Pago (e compatibilidade legada com AbacatePay) e agora inclui a base de checkout por cartão com Stripe.

## Variáveis da Vercel

Configure somente no servidor, em Project Settings → Environment Variables:

- \`DATABASE_URL\`: banco PostgreSQL persistente (Neon ou outro PostgreSQL compatível).
- \`ADMIN_PASSWORD\`: senha forte do painel \`/admin\`.
- \`SESSION_SECRET\`: segredo aleatório longo para assinar tokens.
- \`MERCADOPAGO_ACCESS_TOKEN\`: Access Token do Mercado Pago.
- \`STRIPE_SECRET_KEY\`: chave secreta Stripe (\`sk_test_...\` durante testes).
- \`STRIPE_WEBHOOK_SECRET\`: segredo do endpoint Stripe (\`whsec_...\`).
- \`APP_URL\`: URL pública canônica do app, por exemplo \`https://seudominio.com\`.

Nunca coloque essas chaves em componentes React, arquivos públicos, commits ou mensagens.

## Endpoints de webhook

- Mercado Pago: \`https://seudominio.com/api/mp-webhook\`
- Stripe: \`https://seudominio.com/api/stripe-webhook\`

No Stripe, configure o evento \`checkout.session.completed\` (e, se usar meios assíncronos no futuro, \`checkout.session.async_payment_succeeded\`). O endpoint valida a assinatura Stripe, confere a sessão vinculada ao pedido, moeda e valor antes de liberar a licença.

## Fluxo atual

1. O servidor valida plano, dados e cupom usando os preços definidos em \`src/lib/plans.ts\`.
2. O pedido é criado no banco antes de abrir o checkout.
3. O comprador paga no provedor escolhido.
4. O webhook confirma o pagamento no servidor.
5. O sistema marca o pedido como pago e gera a Key uma única vez.
6. A página \`/comprar?pedido=...\` mostra a Key depois da confirmação.

O retorno do navegador para a página de sucesso **não** libera licença. A confirmação do webhook é obrigatória.

## Limite desta primeira integração Stripe

O checkout Stripe implementado neste branch usa pagamento único (\`mode=payment\`) para os planos atuais de 30 dias, 90 dias e vitalício. Ele não cria cobrança recorrente automática. A renovação recorrente precisa de um ciclo completo de assinatura, eventos de fatura paga/falha/cancelamento e extensão ou suspensão segura das licenças; isso deve ser implementado antes de oferecer mensalidade automática.

O checkout Pix do Mercado Pago existente continua funcionando separadamente.
