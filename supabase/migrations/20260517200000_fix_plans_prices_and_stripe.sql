-- ════════════════════════════════════════════════════════════
-- Atualizar planos: preços corretos + stripe_price_id
-- Starter=$0 | Creator=$3.99 | Pro=$9.99 | Business=$14.99
-- ════════════════════════════════════════════════════════════

-- Remover planos antigos com nomes errados
delete from public.plans where name in ('Free');

-- Upsert de todos os planos com dados corretos
insert into public.plans (name, price, daily_limit, stripe_price_id, features, is_active)
values
  ('Starter',  0,     3,   'price_1T1Tw4EtmRP7yowIz8B9nLGk',
   '["3 compilações/dia","Conversão React → HTML","Download ZIP","Suporte comunidade","Sem crédito necessário"]',
   true),
  ('Creator',  3.99,  10,  'price_1T1TxxEtmRP7yowIn1Aiturg',
   '["10 compilações/dia","Conversão React → HTML","Otimização avançada","Deploy FTP/SFTP","Projetos ilimitados","Histórico de builds","Suporte por email"]',
   true),
  ('Pro',      9.99,  50,  'price_1T1TyjEtmRP7yowIajN9pvrI',
   '["50 compilações/dia","Tudo do Creator +","Deploy automático após build","GitHub Pages integrado","Múltiplos destinos de deploy","Suporte prioritário","API access"]',
   true),
  ('Business', 14.99, 100, 'price_1T1TzQEtmRP7yowIY91nCR66',
   '["100 compilações/dia","Tudo do Pro +","Suporte dedicado 24/7","SLA garantido","Múltiplos usuários (time)","Webhooks personalizados","Consultoria técnica"]',
   true)
on conflict (name) do update set
  price           = excluded.price,
  daily_limit     = excluded.daily_limit,
  stripe_price_id = excluded.stripe_price_id,
  features        = excluded.features,
  is_active       = excluded.is_active;
