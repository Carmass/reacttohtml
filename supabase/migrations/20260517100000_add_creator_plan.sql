-- ════════════════════════════════════════════════════════════
-- Adicionar plano 'Creator' (usado na página de preços)
-- e ajustar stripe_price_id placeholder para os planos pagos
-- ════════════════════════════════════════════════════════════

-- Inserir plano Creator se não existir
insert into public.plans (name, price, daily_limit, features, is_active)
values (
  'Creator', 9, 10,
  '["10 compilações/dia","Conversão React → HTML","Otimização avançada","Deploy FTP/SFTP","Projetos ilimitados","Histórico de builds","Suporte por email"]',
  true
)
on conflict (name) do nothing;

-- Garantir que Business tem daily_limit = 100 (UI mostra 100)
update public.plans set daily_limit = 100 where name = 'Business' and daily_limit = -1;
