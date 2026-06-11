


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."check_free_plan_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
    business_plan text;
    trial_start timestamp;
    monthly_count integer;
    month_start timestamp;
begin

    -- Buscar plano e data de trial
    select plan, trial_start_date
    into business_plan, trial_start
    from ci_businesses
    where id = new.business_id;

    -- Se não for plano free, permitir
    if business_plan is distinct from 'free' then
        return new;
    end if;

    -- Verificar expiração de trial (30 dias)
    if trial_start is not null then
        if (now() - trial_start) > interval '30 days' then
            raise exception 'Seu período gratuito expirou. Faça upgrade para continuar.';
        end if;
    end if;

    -- Calcular início do mês atual
    month_start := date_trunc('month', now());

    -- Contar lançamentos do mês
    select count(*)
    into monthly_count
    from ci_transactions
    where business_id = new.business_id
    and transaction_date >= month_start;

    -- Verificar limite de 30 lançamentos
    if monthly_count >= 30 then
        raise exception 'Limite de 30 lançamentos do plano Free atingido.';
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."check_free_plan_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ci_is_admin_of_business"("p_business_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.ci_user_businesses ub
    where ub.user_id = auth.uid()
      and ub.business_id = p_business_id
      and ub.role in ('owner', 'admin')
  );
$$;


ALTER FUNCTION "public"."ci_is_admin_of_business"("p_business_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."ci_is_admin_of_business"("p_business_id" "uuid") IS 'Valida se o usuario autenticado e admin/owner do business';



CREATE OR REPLACE FUNCTION "public"."ci_is_member_of_business"("p_business_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.ci_user_businesses ub
    where ub.user_id = auth.uid()
      and ub.business_id = p_business_id
  );
$$;


ALTER FUNCTION "public"."ci_is_member_of_business"("p_business_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."ci_is_member_of_business"("p_business_id" "uuid") IS 'Valida se o usuario autenticado pertence ao business';



CREATE OR REPLACE FUNCTION "public"."ci_set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."ci_set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_business_and_profile"("p_user_id" "uuid", "p_email" "text", "p_company_name" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_business_id uuid;
begin

  -- Criar empresa
  insert into public.ci_business (name)
  values (p_company_name)
  returning id into v_business_id;

  -- Criar profile
  insert into public.ci_profiles (
    id,
    business_id,
    email,
    role
  )
  values (
    p_user_id,
    v_business_id,
    p_email,
    'admin'
  );

end;
$$;


ALTER FUNCTION "public"."create_business_and_profile"("p_user_id" "uuid", "p_email" "text", "p_company_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_trial_subscription"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin

  insert into ci_subscriptions (
    id,
    business_id,
    plan,
    status,
    trial_start_at,
    trial_ends_at,
    max_transactions,
    created_at
  )
  values (
    gen_random_uuid(),
    new.id,
    'trial',
    'trial',
    now(),
    now() + interval '10 days',
    30,
    now()
  );

  return new;

exception
  when others then
    -- evita quebrar o cadastro caso algo dê errado
    return new;
end;
$$;


ALTER FUNCTION "public"."create_trial_subscription"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_business_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  select business_id
  from ci_profiles
  where id = auth.uid()
$$;


ALTER FUNCTION "public"."get_my_business_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_role"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select role
  from ci_profiles
  where id = auth.uid()
$$;


ALTER FUNCTION "public"."get_my_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_created_by"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  new.created_by = auth.uid();
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_created_by"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_active_subscription"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists (
    select 1
    from ci_subscriptions
    where business_id = get_my_business_id()
      and status = 'active'
      and current_period_end > now()
  )
$$;


ALTER FUNCTION "public"."has_active_subscription"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_business_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin

  if new.business_id is null then

    new.business_id :=
    (
      select business_id
      from ci_business_users
      where user_id = auth.uid()
      limit 1
    );

  end if;

  return new;

end;
$$;


ALTER FUNCTION "public"."set_business_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_ci_billing_charges_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_ci_billing_charges_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_current_timestamp_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ci_assinatura_eventos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assinatura_id" "uuid" NOT NULL,
    "cobranca_id" "uuid",
    "business_id" "uuid" NOT NULL,
    "tipo" "text" NOT NULL,
    "descricao" "text",
    "origem" "text" DEFAULT 'system'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ci_assinatura_eventos_origem_check" CHECK (("origem" = ANY (ARRAY['system'::"text", 'admin'::"text", 'cron'::"text", 'bling'::"text", 'user'::"text"])))
);


ALTER TABLE "public"."ci_assinatura_eventos" OWNER TO "postgres";


COMMENT ON TABLE "public"."ci_assinatura_eventos" IS 'Auditoria funcional da assinatura e cobrancas';



CREATE TABLE IF NOT EXISTS "public"."ci_assinaturas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "plano" "text" NOT NULL,
    "valor" numeric(10,2) NOT NULL,
    "trial_started_at" timestamp with time zone,
    "trial_ends_at" timestamp with time zone,
    "trial_converted_at" timestamp with time zone,
    "dia_vencimento" integer,
    "proximo_vencimento" "date",
    "tolerancia_dias" integer DEFAULT 3 NOT NULL,
    "assinada_em" timestamp with time zone,
    "cancelada_em" timestamp with time zone,
    "bloqueada_em" timestamp with time zone,
    "bloqueio_manual" boolean DEFAULT false NOT NULL,
    "bling_cliente_id" "text",
    "observacoes_internas" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "payment_method" "text",
    "paused_at" timestamp with time zone,
    "last_payment_attempt_at" timestamp with time zone,
    "reactivation_attempts" integer DEFAULT 0 NOT NULL,
    "last_reactivation_at" timestamp with time zone,
    CONSTRAINT "ci_assinaturas_datas_assinatura_chk" CHECK ((("assinada_em" IS NULL) OR ("assinada_em" >= "created_at"))),
    CONSTRAINT "ci_assinaturas_datas_cancelamento_chk" CHECK ((("cancelada_em" IS NULL) OR ("cancelada_em" >= "created_at"))),
    CONSTRAINT "ci_assinaturas_dia_vencimento_check" CHECK ((("dia_vencimento" = ANY (ARRAY[8, 16, 25])) OR ("dia_vencimento" IS NULL))),
    CONSTRAINT "ci_assinaturas_payment_method_check" CHECK ((("payment_method" = ANY (ARRAY['pix'::"text", 'boleto'::"text"])) OR ("payment_method" IS NULL))),
    CONSTRAINT "ci_assinaturas_status_check" CHECK (("status" = ANY (ARRAY['trialing'::"text", 'active'::"text", 'awaiting_payment'::"text", 'past_due'::"text", 'paused'::"text", 'canceled'::"text", 'cancelled'::"text", 'expired'::"text"]))),
    CONSTRAINT "ci_assinaturas_tolerancia_dias_check" CHECK (("tolerancia_dias" >= 0)),
    CONSTRAINT "ci_assinaturas_trial_datas_chk" CHECK ((("trial_ends_at" IS NULL) OR ("trial_started_at" IS NULL) OR ("trial_ends_at" >= "trial_started_at"))),
    CONSTRAINT "ci_assinaturas_valor_check" CHECK (("valor" >= (0)::numeric))
);


ALTER TABLE "public"."ci_assinaturas" OWNER TO "postgres";


COMMENT ON TABLE "public"."ci_assinaturas" IS 'Estado oficial da assinatura no Caixa Inteligente. O SaaS é o cérebro.';



COMMENT ON COLUMN "public"."ci_assinaturas"."status" IS 'trialing, active, grace_period, overdue, blocked, canceled';



COMMENT ON COLUMN "public"."ci_assinaturas"."dia_vencimento" IS 'Permitido apenas 5, 10, 15 ou 20';



COMMENT ON COLUMN "public"."ci_assinaturas"."proximo_vencimento" IS 'Data oficial do próximo vencimento controlada internamente pelo SaaS';



CREATE TABLE IF NOT EXISTS "public"."ci_audit_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "business_id" "uuid",
    "user_id" "uuid",
    "action" "text",
    "table_name" "text",
    "record_id" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."ci_audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ci_billing_charges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "subscription_id" "uuid",
    "customer_id" "uuid",
    "provider" "text" DEFAULT 'bling'::"text" NOT NULL,
    "bling_charge_id" "text",
    "bling_contact_id" "text",
    "external_status" "text",
    "amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "due_date" "date",
    "payment_url" "text",
    "barcode" "text",
    "pix_qr_code" "text",
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "last_synced_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "payment_method" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "payment_link" "text",
    "boleto_link" "text",
    "pix_code" "text",
    "raw_payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "description" "text",
    "pix_qr_code_link" "text",
    "pix_transaction_id" "text",
    "raw_response" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "paid_at" timestamp with time zone,
    CONSTRAINT "ci_billing_charges_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['pix'::"text", 'boleto'::"text"]))),
    CONSTRAINT "ci_billing_charges_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'generated'::"text", 'paid'::"text", 'expired'::"text", 'cancelled'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."ci_billing_charges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ci_billing_contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "provider" "text" DEFAULT 'bling'::"text" NOT NULL,
    "bling_contact_id" "text" NOT NULL,
    "document" "text",
    "email" "text",
    "name" "text",
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ci_billing_contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ci_bling_sync_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid",
    "assinatura_id" "uuid",
    "cobranca_id" "uuid",
    "operacao" "text" NOT NULL,
    "status" "text" NOT NULL,
    "request_payload" "jsonb",
    "response_payload" "jsonb",
    "erro" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ci_bling_sync_logs_status_check" CHECK (("status" = ANY (ARRAY['success'::"text", 'error'::"text"])))
);


ALTER TABLE "public"."ci_bling_sync_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."ci_bling_sync_logs" IS 'Log tecnico da integracao com o Bling';



CREATE TABLE IF NOT EXISTS "public"."ci_business" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "owner_user_id" "uuid",
    "name" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "onboarding_completed" boolean DEFAULT false,
    "cnpj" "text",
    "cep" "text",
    "rua" "text",
    "numero" "text",
    "complemento" "text",
    "bairro" "text",
    "municipio" "text",
    "uf" "text",
    "nome_responsavel" "text",
    "whatsapp" "text",
    "email_financeiro" "text"
);


ALTER TABLE "public"."ci_business" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ci_categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "business_id" "uuid",
    "name" "text" NOT NULL,
    "type" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "is_fixed" boolean DEFAULT false,
    CONSTRAINT "ci_categories_type_check" CHECK (("type" = ANY (ARRAY['income'::"text", 'expense'::"text"])))
);


ALTER TABLE "public"."ci_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ci_cobrancas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assinatura_id" "uuid" NOT NULL,
    "business_id" "uuid" NOT NULL,
    "competencia" "text" NOT NULL,
    "ciclo_tipo" "text" NOT NULL,
    "valor" numeric(10,2) NOT NULL,
    "gerada_em" timestamp with time zone,
    "enviada_ao_bling_em" timestamp with time zone,
    "vencimento" "date" NOT NULL,
    "status" "text" NOT NULL,
    "sync_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "sync_error" "text",
    "bling_cobranca_id" "text",
    "bling_numero_documento" "text",
    "bling_link_pagamento" "text",
    "bling_status_raw" "text",
    "pago_em" timestamp with time zone,
    "ultima_consulta_bling_em" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ci_cobrancas_ciclo_tipo_check" CHECK (("ciclo_tipo" = ANY (ARRAY['first_charge'::"text", 'recurring'::"text"]))),
    CONSTRAINT "ci_cobrancas_pago_em_chk" CHECK ((("pago_em" IS NULL) OR ("gerada_em" IS NULL) OR ("pago_em" >= "gerada_em"))),
    CONSTRAINT "ci_cobrancas_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'overdue'::"text", 'canceled'::"text"]))),
    CONSTRAINT "ci_cobrancas_sync_status_check" CHECK (("sync_status" = ANY (ARRAY['pending'::"text", 'success'::"text", 'error'::"text"]))),
    CONSTRAINT "ci_cobrancas_valor_check" CHECK (("valor" >= (0)::numeric))
);


ALTER TABLE "public"."ci_cobrancas" OWNER TO "postgres";


COMMENT ON TABLE "public"."ci_cobrancas" IS 'Historico de cobrancas mensais da assinatura';



COMMENT ON COLUMN "public"."ci_cobrancas"."ciclo_tipo" IS 'first_charge = primeira cobranca apos clique em assinar; recurring = mensal recorrente';



COMMENT ON COLUMN "public"."ci_cobrancas"."status" IS 'pending, paid, overdue, canceled';



COMMENT ON COLUMN "public"."ci_cobrancas"."sync_status" IS 'pending, success, error';



CREATE TABLE IF NOT EXISTS "public"."ci_contacts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "business_id" "uuid",
    "name" "text" NOT NULL,
    "phone" "text",
    "email" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "type" "text"
);


ALTER TABLE "public"."ci_contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ci_goals" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "business_id" "uuid",
    "title" "text",
    "target_amount" numeric(12,2),
    "month" integer,
    "year" integer,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."ci_goals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ci_integracoes_bling" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "access_token" "text",
    "refresh_token" "text",
    "token_type" "text",
    "expires_in" integer,
    "expires_at" timestamp with time zone,
    "scope" "text",
    "bling_user_id" "text",
    "bling_tenant_id" "text",
    "status" "text" DEFAULT 'disconnected'::"text" NOT NULL,
    "last_error" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ci_integracoes_bling_status_check" CHECK (("status" = ANY (ARRAY['disconnected'::"text", 'connected'::"text", 'error'::"text"])))
);


ALTER TABLE "public"."ci_integracoes_bling" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ci_leads_desafio" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome" "text" NOT NULL,
    "email" "text" NOT NULL,
    "whatsapp" "text" NOT NULL,
    "dificuldade" "text",
    "origem" "text" DEFAULT 'landing-desafio-5-dias'::"text" NOT NULL,
    "status" "text" DEFAULT 'novo'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ci_leads_desafio" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ci_master_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome" "text" NOT NULL,
    "email" "text" NOT NULL,
    "status" "text" DEFAULT 'ativo'::"text" NOT NULL,
    "observacoes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ci_master_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ci_platform_integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" "text" NOT NULL,
    "status" "text" DEFAULT 'inactive'::"text" NOT NULL,
    "access_token" "text",
    "refresh_token" "text",
    "token_type" "text",
    "expires_at" timestamp with time zone,
    "scope" "text",
    "account_name" "text",
    "account_email" "text",
    "external_account_id" "text",
    "last_auth_at" timestamp with time zone,
    "last_refresh_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ci_platform_integrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ci_services" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "business_id" "uuid",
    "name" "text" NOT NULL,
    "price" numeric(12,2),
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."ci_services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ci_transaction_services" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "transaction_id" "uuid",
    "service_id" "uuid",
    "business_id" "uuid" NOT NULL
);


ALTER TABLE "public"."ci_transaction_services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ci_transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "business_id" "uuid",
    "contact_id" "uuid",
    "category_id" "uuid",
    "type" "text",
    "amount" numeric(12,2) NOT NULL,
    "description" "text",
    "transaction_date" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "service_id" "uuid",
    CONSTRAINT "ci_transactions_type_check" CHECK (("type" = ANY (ARRAY['income'::"text", 'expense'::"text"])))
);


ALTER TABLE "public"."ci_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ci_user_businesses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "business_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ci_user_businesses_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'member'::"text"])))
);


ALTER TABLE "public"."ci_user_businesses" OWNER TO "postgres";


COMMENT ON TABLE "public"."ci_user_businesses" IS 'Relaciona usuarios autenticados com businesses do SaaS';



CREATE TABLE IF NOT EXISTS "public"."contatos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome" "text",
    "telefone" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."contatos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."difal_leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome" "text" NOT NULL,
    "email" "text" NOT NULL,
    "whatsapp" "text" NOT NULL,
    "duvida_aplicacao_difal" "text" NOT NULL,
    "origem" "text" DEFAULT 'diagnostico-difal'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "difal_leads_vende_outros_estados_check" CHECK (("duvida_aplicacao_difal" = ANY (ARRAY['sim'::"text", 'nao'::"text", 'tenho_duvida'::"text"])))
);


ALTER TABLE "public"."difal_leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dispositivos_ec132" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "artigo" "text",
    "paragrafo" "text",
    "inciso" "text",
    "alinea" "text",
    "texto_original" "text",
    "texto_limpo_ia" "text",
    "tag_principal" "text",
    "subtag" "text",
    "impacto_pratico" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "base_legal" "text",
    "embedding" "public"."vector"(1536)
);


ALTER TABLE "public"."dispositivos_ec132" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."followups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "contact_id" "uuid",
    "due_date" timestamp without time zone,
    "status" "text" DEFAULT 'pending'::"text",
    "note" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."followups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid",
    "type" "text",
    "content" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."interactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "title" "text",
    "content" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."templates" OWNER TO "postgres";


ALTER TABLE ONLY "public"."ci_assinatura_eventos"
    ADD CONSTRAINT "ci_assinatura_eventos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ci_assinaturas"
    ADD CONSTRAINT "ci_assinaturas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ci_audit_logs"
    ADD CONSTRAINT "ci_audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ci_billing_charges"
    ADD CONSTRAINT "ci_billing_charges_bling_charge_id_key" UNIQUE ("bling_charge_id");



ALTER TABLE ONLY "public"."ci_billing_charges"
    ADD CONSTRAINT "ci_billing_charges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ci_billing_contacts"
    ADD CONSTRAINT "ci_billing_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ci_bling_sync_logs"
    ADD CONSTRAINT "ci_bling_sync_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ci_business"
    ADD CONSTRAINT "ci_business_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ci_categories"
    ADD CONSTRAINT "ci_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ci_cobrancas"
    ADD CONSTRAINT "ci_cobrancas_assinatura_competencia_unique" UNIQUE ("assinatura_id", "competencia");



ALTER TABLE ONLY "public"."ci_cobrancas"
    ADD CONSTRAINT "ci_cobrancas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ci_contacts"
    ADD CONSTRAINT "ci_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ci_goals"
    ADD CONSTRAINT "ci_goals_business_unique" UNIQUE ("business_id");



ALTER TABLE ONLY "public"."ci_goals"
    ADD CONSTRAINT "ci_goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ci_integracoes_bling"
    ADD CONSTRAINT "ci_integracoes_bling_business_id_key" UNIQUE ("business_id");



ALTER TABLE ONLY "public"."ci_integracoes_bling"
    ADD CONSTRAINT "ci_integracoes_bling_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ci_leads_desafio"
    ADD CONSTRAINT "ci_leads_desafio_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ci_master_users"
    ADD CONSTRAINT "ci_master_users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."ci_master_users"
    ADD CONSTRAINT "ci_master_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ci_platform_integrations"
    ADD CONSTRAINT "ci_platform_integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ci_platform_integrations"
    ADD CONSTRAINT "ci_platform_integrations_provider_key" UNIQUE ("provider");



ALTER TABLE ONLY "public"."ci_services"
    ADD CONSTRAINT "ci_services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ci_transaction_services"
    ADD CONSTRAINT "ci_transaction_services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ci_transactions"
    ADD CONSTRAINT "ci_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ci_user_businesses"
    ADD CONSTRAINT "ci_user_businesses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ci_user_businesses"
    ADD CONSTRAINT "ci_user_businesses_user_id_business_id_key" UNIQUE ("user_id", "business_id");



ALTER TABLE ONLY "public"."contatos"
    ADD CONSTRAINT "contatos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."difal_leads"
    ADD CONSTRAINT "difal_leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dispositivos_ec132"
    ADD CONSTRAINT "dispositivos_ec132_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."followups"
    ADD CONSTRAINT "followups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."templates"
    ADD CONSTRAINT "templates_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "ci_business_owner_user_id_key" ON "public"."ci_business" USING "btree" ("owner_user_id");



CREATE INDEX "idx_ci_assinatura_eventos_assinatura_id" ON "public"."ci_assinatura_eventos" USING "btree" ("assinatura_id");



CREATE INDEX "idx_ci_assinatura_eventos_business_id" ON "public"."ci_assinatura_eventos" USING "btree" ("business_id");



CREATE INDEX "idx_ci_assinatura_eventos_cobranca_id" ON "public"."ci_assinatura_eventos" USING "btree" ("cobranca_id");



CREATE INDEX "idx_ci_assinatura_eventos_created_at" ON "public"."ci_assinatura_eventos" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_ci_assinatura_eventos_tipo" ON "public"."ci_assinatura_eventos" USING "btree" ("tipo");



CREATE UNIQUE INDEX "idx_ci_assinaturas_business_active_unique" ON "public"."ci_assinaturas" USING "btree" ("business_id") WHERE ("cancelada_em" IS NULL);



CREATE INDEX "idx_ci_assinaturas_paused_at" ON "public"."ci_assinaturas" USING "btree" ("paused_at");



CREATE INDEX "idx_ci_assinaturas_proximo_vencimento" ON "public"."ci_assinaturas" USING "btree" ("proximo_vencimento");



CREATE INDEX "idx_ci_assinaturas_reactivation_status" ON "public"."ci_assinaturas" USING "btree" ("business_id", "status", "paused_at");



CREATE INDEX "idx_ci_assinaturas_status" ON "public"."ci_assinaturas" USING "btree" ("status");



CREATE INDEX "idx_ci_assinaturas_trial_ends_at" ON "public"."ci_assinaturas" USING "btree" ("trial_ends_at");



CREATE INDEX "idx_ci_billing_charges_bling_charge_id" ON "public"."ci_billing_charges" USING "btree" ("bling_charge_id");



CREATE UNIQUE INDEX "idx_ci_billing_charges_bling_charge_id_unique" ON "public"."ci_billing_charges" USING "btree" ("bling_charge_id") WHERE ("bling_charge_id" IS NOT NULL);



CREATE INDEX "idx_ci_billing_charges_business_id" ON "public"."ci_billing_charges" USING "btree" ("business_id");



CREATE INDEX "idx_ci_billing_charges_business_id_created_at" ON "public"."ci_billing_charges" USING "btree" ("business_id", "created_at" DESC);



CREATE INDEX "idx_ci_billing_charges_customer_id" ON "public"."ci_billing_charges" USING "btree" ("customer_id");



CREATE INDEX "idx_ci_billing_charges_payment_method" ON "public"."ci_billing_charges" USING "btree" ("payment_method");



CREATE INDEX "idx_ci_billing_charges_status" ON "public"."ci_billing_charges" USING "btree" ("status");



CREATE INDEX "idx_ci_billing_charges_subscription_id" ON "public"."ci_billing_charges" USING "btree" ("subscription_id");



CREATE INDEX "idx_ci_bling_sync_logs_assinatura_id" ON "public"."ci_bling_sync_logs" USING "btree" ("assinatura_id");



CREATE INDEX "idx_ci_bling_sync_logs_business_id" ON "public"."ci_bling_sync_logs" USING "btree" ("business_id");



CREATE INDEX "idx_ci_bling_sync_logs_cobranca_id" ON "public"."ci_bling_sync_logs" USING "btree" ("cobranca_id");



CREATE INDEX "idx_ci_bling_sync_logs_created_at" ON "public"."ci_bling_sync_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_ci_bling_sync_logs_operacao" ON "public"."ci_bling_sync_logs" USING "btree" ("operacao");



CREATE INDEX "idx_ci_cobrancas_assinatura_id" ON "public"."ci_cobrancas" USING "btree" ("assinatura_id");



CREATE INDEX "idx_ci_cobrancas_bling_cobranca_id" ON "public"."ci_cobrancas" USING "btree" ("bling_cobranca_id");



CREATE INDEX "idx_ci_cobrancas_business_id" ON "public"."ci_cobrancas" USING "btree" ("business_id");



CREATE INDEX "idx_ci_cobrancas_status" ON "public"."ci_cobrancas" USING "btree" ("status");



CREATE INDEX "idx_ci_cobrancas_sync_status" ON "public"."ci_cobrancas" USING "btree" ("sync_status");



CREATE INDEX "idx_ci_cobrancas_vencimento" ON "public"."ci_cobrancas" USING "btree" ("vencimento");



CREATE INDEX "idx_ci_leads_desafio_created_at" ON "public"."ci_leads_desafio" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_ci_leads_desafio_email" ON "public"."ci_leads_desafio" USING "btree" ("email");



CREATE INDEX "idx_ci_leads_desafio_whatsapp" ON "public"."ci_leads_desafio" USING "btree" ("whatsapp");



CREATE INDEX "idx_ci_master_users_email" ON "public"."ci_master_users" USING "btree" ("email");



CREATE INDEX "idx_ci_master_users_status" ON "public"."ci_master_users" USING "btree" ("status");



CREATE INDEX "idx_ci_user_businesses_business_id" ON "public"."ci_user_businesses" USING "btree" ("business_id");



CREATE INDEX "idx_ci_user_businesses_user_id" ON "public"."ci_user_businesses" USING "btree" ("user_id");



CREATE INDEX "idx_difal_leads_created_at" ON "public"."difal_leads" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_difal_leads_email" ON "public"."difal_leads" USING "btree" ("email");



CREATE OR REPLACE TRIGGER "create_trial_subscription_after_business" AFTER INSERT ON "public"."ci_business" FOR EACH ROW EXECUTE FUNCTION "public"."create_trial_subscription"();



CREATE OR REPLACE TRIGGER "set_created_by" BEFORE INSERT ON "public"."contatos" FOR EACH ROW EXECUTE FUNCTION "public"."handle_created_by"();



CREATE OR REPLACE TRIGGER "trg_ci_assinaturas_updated_at" BEFORE UPDATE ON "public"."ci_assinaturas" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "trg_ci_billing_charges_updated_at" BEFORE UPDATE ON "public"."ci_billing_charges" FOR EACH ROW EXECUTE FUNCTION "public"."set_ci_billing_charges_updated_at"();



CREATE OR REPLACE TRIGGER "trg_ci_cobrancas_updated_at" BEFORE UPDATE ON "public"."ci_cobrancas" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "trg_ci_integracoes_bling_updated_at" BEFORE UPDATE ON "public"."ci_integracoes_bling" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_ci_billing_charges_updated_at" BEFORE UPDATE ON "public"."ci_billing_charges" FOR EACH ROW EXECUTE FUNCTION "public"."set_ci_billing_charges_updated_at"();



ALTER TABLE ONLY "public"."ci_assinatura_eventos"
    ADD CONSTRAINT "ci_assinatura_eventos_assinatura_id_fkey" FOREIGN KEY ("assinatura_id") REFERENCES "public"."ci_assinaturas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ci_assinatura_eventos"
    ADD CONSTRAINT "ci_assinatura_eventos_cobranca_id_fkey" FOREIGN KEY ("cobranca_id") REFERENCES "public"."ci_cobrancas"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ci_bling_sync_logs"
    ADD CONSTRAINT "ci_bling_sync_logs_assinatura_id_fkey" FOREIGN KEY ("assinatura_id") REFERENCES "public"."ci_assinaturas"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ci_bling_sync_logs"
    ADD CONSTRAINT "ci_bling_sync_logs_cobranca_id_fkey" FOREIGN KEY ("cobranca_id") REFERENCES "public"."ci_cobrancas"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ci_business"
    ADD CONSTRAINT "ci_business_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ci_categories"
    ADD CONSTRAINT "ci_categories_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."ci_business"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ci_cobrancas"
    ADD CONSTRAINT "ci_cobrancas_assinatura_id_fkey" FOREIGN KEY ("assinatura_id") REFERENCES "public"."ci_assinaturas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ci_contacts"
    ADD CONSTRAINT "ci_contacts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."ci_business"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ci_goals"
    ADD CONSTRAINT "ci_goals_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."ci_business"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ci_services"
    ADD CONSTRAINT "ci_services_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."ci_business"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ci_transaction_services"
    ADD CONSTRAINT "ci_transaction_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."ci_services"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ci_transaction_services"
    ADD CONSTRAINT "ci_transaction_services_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."ci_transactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ci_transactions"
    ADD CONSTRAINT "ci_transactions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."ci_business"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ci_transactions"
    ADD CONSTRAINT "ci_transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."ci_categories"("id");



ALTER TABLE ONLY "public"."ci_transactions"
    ADD CONSTRAINT "ci_transactions_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."ci_contacts"("id");



ALTER TABLE ONLY "public"."ci_transactions"
    ADD CONSTRAINT "fk_category" FOREIGN KEY ("category_id") REFERENCES "public"."ci_categories"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ci_transactions"
    ADD CONSTRAINT "fk_contact" FOREIGN KEY ("contact_id") REFERENCES "public"."ci_contacts"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ci_transactions"
    ADD CONSTRAINT "fk_service" FOREIGN KEY ("service_id") REFERENCES "public"."ci_services"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."followups"
    ADD CONSTRAINT "followups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."templates"
    ADD CONSTRAINT "templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow insert own business" ON "public"."ci_business" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_user_id"));



CREATE POLICY "Allow select own business" ON "public"."ci_business" FOR SELECT USING (("auth"."uid"() = "owner_user_id"));



CREATE POLICY "Bloquear select público difal leads" ON "public"."difal_leads" FOR SELECT TO "anon" USING (false);



CREATE POLICY "Insert own contatos" ON "public"."contatos" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Permitir insert público difal leads" ON "public"."difal_leads" FOR INSERT TO "anon" WITH CHECK ((("origem" = 'diagnostico-difal'::"text") AND ("nome" IS NOT NULL) AND ("email" IS NOT NULL) AND ("whatsapp" IS NOT NULL) AND ("duvida_aplicacao_difal" = ANY (ARRAY['sim'::"text", 'nao'::"text", 'tenho_duvida'::"text", 'Sim'::"text", 'Não'::"text", 'Tenho dúvida'::"text"]))));



CREATE POLICY "Permitir leitura autenticada" ON "public"."difal_leads" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users access own business" ON "public"."ci_business" FOR SELECT USING (("owner_user_id" = "auth"."uid"()));



CREATE POLICY "Users can create their own business" ON "public"."ci_business" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_user_id"));



CREATE POLICY "Users can manage own followups" ON "public"."followups" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own templates" ON "public"."templates" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own business" ON "public"."ci_business" FOR UPDATE USING (("auth"."uid"() = "owner_user_id"));



CREATE POLICY "Users can view their own business" ON "public"."ci_business" FOR SELECT USING (("auth"."uid"() = "owner_user_id"));



CREATE POLICY "Usuário pode atualizar seus contatos" ON "public"."contatos" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Usuário pode deletar seus contatos" ON "public"."contatos" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "created_by"));



CREATE POLICY "business_select" ON "public"."ci_business" FOR SELECT USING (("owner_user_id" = "auth"."uid"()));



ALTER TABLE "public"."ci_assinatura_eventos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ci_assinatura_eventos_select_admin_only" ON "public"."ci_assinatura_eventos" FOR SELECT TO "authenticated" USING ("public"."ci_is_admin_of_business"("business_id"));



ALTER TABLE "public"."ci_assinaturas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ci_assinaturas_select_own_business" ON "public"."ci_assinaturas" FOR SELECT TO "authenticated" USING ("public"."ci_is_member_of_business"("business_id"));



ALTER TABLE "public"."ci_audit_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ci_audit_logs_insert_own_business" ON "public"."ci_audit_logs" FOR INSERT TO "authenticated" WITH CHECK (("business_id" IN ( SELECT "ci_business"."id"
   FROM "public"."ci_business"
  WHERE ("ci_business"."owner_user_id" = "auth"."uid"()))));



CREATE POLICY "ci_audit_logs_select_own_business" ON "public"."ci_audit_logs" FOR SELECT TO "authenticated" USING (("business_id" IN ( SELECT "ci_business"."id"
   FROM "public"."ci_business"
  WHERE ("ci_business"."owner_user_id" = "auth"."uid"()))));



ALTER TABLE "public"."ci_billing_charges" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ci_billing_charges_select_own_business" ON "public"."ci_billing_charges" FOR SELECT TO "authenticated" USING ("public"."ci_is_member_of_business"("business_id"));



ALTER TABLE "public"."ci_bling_sync_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ci_bling_sync_logs_select_admin_only" ON "public"."ci_bling_sync_logs" FOR SELECT TO "authenticated" USING ("public"."ci_is_admin_of_business"("business_id"));



ALTER TABLE "public"."ci_business" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ci_categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ci_categories_delete_own_business" ON "public"."ci_categories" FOR DELETE TO "authenticated" USING (("business_id" IN ( SELECT "ci_business"."id"
   FROM "public"."ci_business"
  WHERE ("ci_business"."owner_user_id" = "auth"."uid"()))));



CREATE POLICY "ci_categories_insert_own_business" ON "public"."ci_categories" FOR INSERT TO "authenticated" WITH CHECK (("business_id" IN ( SELECT "ci_business"."id"
   FROM "public"."ci_business"
  WHERE ("ci_business"."owner_user_id" = "auth"."uid"()))));



CREATE POLICY "ci_categories_select_own_business" ON "public"."ci_categories" FOR SELECT TO "authenticated" USING (("business_id" IN ( SELECT "ci_business"."id"
   FROM "public"."ci_business"
  WHERE ("ci_business"."owner_user_id" = "auth"."uid"()))));



CREATE POLICY "ci_categories_update_own_business" ON "public"."ci_categories" FOR UPDATE TO "authenticated" USING (("business_id" IN ( SELECT "ci_business"."id"
   FROM "public"."ci_business"
  WHERE ("ci_business"."owner_user_id" = "auth"."uid"())))) WITH CHECK (("business_id" IN ( SELECT "ci_business"."id"
   FROM "public"."ci_business"
  WHERE ("ci_business"."owner_user_id" = "auth"."uid"()))));



ALTER TABLE "public"."ci_cobrancas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ci_cobrancas_select_own_business" ON "public"."ci_cobrancas" FOR SELECT TO "authenticated" USING ("public"."ci_is_member_of_business"("business_id"));



ALTER TABLE "public"."ci_contacts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ci_contacts_delete_own_business" ON "public"."ci_contacts" FOR DELETE TO "authenticated" USING (("business_id" IN ( SELECT "ci_business"."id"
   FROM "public"."ci_business"
  WHERE ("ci_business"."owner_user_id" = "auth"."uid"()))));



CREATE POLICY "ci_contacts_insert_own_business" ON "public"."ci_contacts" FOR INSERT TO "authenticated" WITH CHECK (("business_id" IN ( SELECT "ci_business"."id"
   FROM "public"."ci_business"
  WHERE ("ci_business"."owner_user_id" = "auth"."uid"()))));



CREATE POLICY "ci_contacts_select_own_business" ON "public"."ci_contacts" FOR SELECT TO "authenticated" USING (("business_id" IN ( SELECT "ci_business"."id"
   FROM "public"."ci_business"
  WHERE ("ci_business"."owner_user_id" = "auth"."uid"()))));



CREATE POLICY "ci_contacts_update_own_business" ON "public"."ci_contacts" FOR UPDATE TO "authenticated" USING (("business_id" IN ( SELECT "ci_business"."id"
   FROM "public"."ci_business"
  WHERE ("ci_business"."owner_user_id" = "auth"."uid"())))) WITH CHECK (("business_id" IN ( SELECT "ci_business"."id"
   FROM "public"."ci_business"
  WHERE ("ci_business"."owner_user_id" = "auth"."uid"()))));



ALTER TABLE "public"."ci_goals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ci_goals_delete_own_business" ON "public"."ci_goals" FOR DELETE TO "authenticated" USING (("business_id" IN ( SELECT "ci_business"."id"
   FROM "public"."ci_business"
  WHERE ("ci_business"."owner_user_id" = "auth"."uid"()))));



CREATE POLICY "ci_goals_insert_own_business" ON "public"."ci_goals" FOR INSERT TO "authenticated" WITH CHECK (("business_id" IN ( SELECT "ci_business"."id"
   FROM "public"."ci_business"
  WHERE ("ci_business"."owner_user_id" = "auth"."uid"()))));



CREATE POLICY "ci_goals_select_own_business" ON "public"."ci_goals" FOR SELECT TO "authenticated" USING (("business_id" IN ( SELECT "ci_business"."id"
   FROM "public"."ci_business"
  WHERE ("ci_business"."owner_user_id" = "auth"."uid"()))));



CREATE POLICY "ci_goals_update_own_business" ON "public"."ci_goals" FOR UPDATE TO "authenticated" USING (("business_id" IN ( SELECT "ci_business"."id"
   FROM "public"."ci_business"
  WHERE ("ci_business"."owner_user_id" = "auth"."uid"())))) WITH CHECK (("business_id" IN ( SELECT "ci_business"."id"
   FROM "public"."ci_business"
  WHERE ("ci_business"."owner_user_id" = "auth"."uid"()))));



ALTER TABLE "public"."ci_services" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ci_services_delete_own_business" ON "public"."ci_services" FOR DELETE TO "authenticated" USING (("business_id" IN ( SELECT "ci_business"."id"
   FROM "public"."ci_business"
  WHERE ("ci_business"."owner_user_id" = "auth"."uid"()))));



CREATE POLICY "ci_services_insert_own_business" ON "public"."ci_services" FOR INSERT TO "authenticated" WITH CHECK (("business_id" IN ( SELECT "ci_business"."id"
   FROM "public"."ci_business"
  WHERE ("ci_business"."owner_user_id" = "auth"."uid"()))));



CREATE POLICY "ci_services_select_own_business" ON "public"."ci_services" FOR SELECT TO "authenticated" USING (("business_id" IN ( SELECT "ci_business"."id"
   FROM "public"."ci_business"
  WHERE ("ci_business"."owner_user_id" = "auth"."uid"()))));



CREATE POLICY "ci_services_update_own_business" ON "public"."ci_services" FOR UPDATE TO "authenticated" USING (("business_id" IN ( SELECT "ci_business"."id"
   FROM "public"."ci_business"
  WHERE ("ci_business"."owner_user_id" = "auth"."uid"())))) WITH CHECK (("business_id" IN ( SELECT "ci_business"."id"
   FROM "public"."ci_business"
  WHERE ("ci_business"."owner_user_id" = "auth"."uid"()))));



ALTER TABLE "public"."ci_transaction_services" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ci_transaction_services_delete_own_business" ON "public"."ci_transaction_services" FOR DELETE TO "authenticated" USING (("business_id" IN ( SELECT "ci_business"."id"
   FROM "public"."ci_business"
  WHERE ("ci_business"."owner_user_id" = "auth"."uid"()))));



CREATE POLICY "ci_transaction_services_insert_own_business" ON "public"."ci_transaction_services" FOR INSERT TO "authenticated" WITH CHECK (("business_id" IN ( SELECT "ci_business"."id"
   FROM "public"."ci_business"
  WHERE ("ci_business"."owner_user_id" = "auth"."uid"()))));



CREATE POLICY "ci_transaction_services_select_own_business" ON "public"."ci_transaction_services" FOR SELECT TO "authenticated" USING (("business_id" IN ( SELECT "ci_business"."id"
   FROM "public"."ci_business"
  WHERE ("ci_business"."owner_user_id" = "auth"."uid"()))));



ALTER TABLE "public"."ci_transactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ci_transactions_delete_own_business" ON "public"."ci_transactions" FOR DELETE TO "authenticated" USING (("business_id" IN ( SELECT "ci_business"."id"
   FROM "public"."ci_business"
  WHERE ("ci_business"."owner_user_id" = "auth"."uid"()))));



CREATE POLICY "ci_transactions_insert_own_business" ON "public"."ci_transactions" FOR INSERT TO "authenticated" WITH CHECK (("business_id" IN ( SELECT "ci_business"."id"
   FROM "public"."ci_business"
  WHERE ("ci_business"."owner_user_id" = "auth"."uid"()))));



CREATE POLICY "ci_transactions_select_own_business" ON "public"."ci_transactions" FOR SELECT TO "authenticated" USING (("business_id" IN ( SELECT "ci_business"."id"
   FROM "public"."ci_business"
  WHERE ("ci_business"."owner_user_id" = "auth"."uid"()))));



CREATE POLICY "ci_transactions_update_own_business" ON "public"."ci_transactions" FOR UPDATE TO "authenticated" USING (("business_id" IN ( SELECT "ci_business"."id"
   FROM "public"."ci_business"
  WHERE ("ci_business"."owner_user_id" = "auth"."uid"())))) WITH CHECK (("business_id" IN ( SELECT "ci_business"."id"
   FROM "public"."ci_business"
  WHERE ("ci_business"."owner_user_id" = "auth"."uid"()))));



ALTER TABLE "public"."ci_user_businesses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ci_user_businesses_select_own_rows" ON "public"."ci_user_businesses" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."contatos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."difal_leads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dispositivos_ec132" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."followups" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert contacts" ON "public"."contatos" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."interactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "select contacts" ON "public"."contatos" FOR SELECT USING (true);



ALTER TABLE "public"."templates" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."check_free_plan_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_free_plan_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_free_plan_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ci_is_admin_of_business"("p_business_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."ci_is_admin_of_business"("p_business_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ci_is_admin_of_business"("p_business_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."ci_is_member_of_business"("p_business_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."ci_is_member_of_business"("p_business_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ci_is_member_of_business"("p_business_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."ci_set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."ci_set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ci_set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_business_and_profile"("p_user_id" "uuid", "p_email" "text", "p_company_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_business_and_profile"("p_user_id" "uuid", "p_email" "text", "p_company_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_business_and_profile"("p_user_id" "uuid", "p_email" "text", "p_company_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_trial_subscription"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_trial_subscription"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_trial_subscription"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_business_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_business_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_business_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_created_by"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_created_by"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_created_by"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_active_subscription"() TO "anon";
GRANT ALL ON FUNCTION "public"."has_active_subscription"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_active_subscription"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_business_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_business_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_business_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_ci_billing_charges_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_ci_billing_charges_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_ci_billing_charges_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_current_timestamp_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_current_timestamp_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_current_timestamp_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."ci_assinatura_eventos" TO "anon";
GRANT ALL ON TABLE "public"."ci_assinatura_eventos" TO "authenticated";
GRANT ALL ON TABLE "public"."ci_assinatura_eventos" TO "service_role";



GRANT ALL ON TABLE "public"."ci_assinaturas" TO "anon";
GRANT ALL ON TABLE "public"."ci_assinaturas" TO "authenticated";
GRANT ALL ON TABLE "public"."ci_assinaturas" TO "service_role";



GRANT ALL ON TABLE "public"."ci_audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."ci_audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."ci_audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."ci_billing_charges" TO "anon";
GRANT ALL ON TABLE "public"."ci_billing_charges" TO "authenticated";
GRANT ALL ON TABLE "public"."ci_billing_charges" TO "service_role";



GRANT ALL ON TABLE "public"."ci_billing_contacts" TO "anon";
GRANT ALL ON TABLE "public"."ci_billing_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."ci_billing_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."ci_bling_sync_logs" TO "anon";
GRANT ALL ON TABLE "public"."ci_bling_sync_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."ci_bling_sync_logs" TO "service_role";



GRANT ALL ON TABLE "public"."ci_business" TO "anon";
GRANT ALL ON TABLE "public"."ci_business" TO "authenticated";
GRANT ALL ON TABLE "public"."ci_business" TO "service_role";



GRANT ALL ON TABLE "public"."ci_categories" TO "anon";
GRANT ALL ON TABLE "public"."ci_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."ci_categories" TO "service_role";



GRANT ALL ON TABLE "public"."ci_cobrancas" TO "anon";
GRANT ALL ON TABLE "public"."ci_cobrancas" TO "authenticated";
GRANT ALL ON TABLE "public"."ci_cobrancas" TO "service_role";



GRANT ALL ON TABLE "public"."ci_contacts" TO "anon";
GRANT ALL ON TABLE "public"."ci_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."ci_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."ci_goals" TO "anon";
GRANT ALL ON TABLE "public"."ci_goals" TO "authenticated";
GRANT ALL ON TABLE "public"."ci_goals" TO "service_role";



GRANT ALL ON TABLE "public"."ci_integracoes_bling" TO "anon";
GRANT ALL ON TABLE "public"."ci_integracoes_bling" TO "authenticated";
GRANT ALL ON TABLE "public"."ci_integracoes_bling" TO "service_role";



GRANT ALL ON TABLE "public"."ci_leads_desafio" TO "anon";
GRANT ALL ON TABLE "public"."ci_leads_desafio" TO "authenticated";
GRANT ALL ON TABLE "public"."ci_leads_desafio" TO "service_role";



GRANT ALL ON TABLE "public"."ci_master_users" TO "anon";
GRANT ALL ON TABLE "public"."ci_master_users" TO "authenticated";
GRANT ALL ON TABLE "public"."ci_master_users" TO "service_role";



GRANT ALL ON TABLE "public"."ci_platform_integrations" TO "anon";
GRANT ALL ON TABLE "public"."ci_platform_integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."ci_platform_integrations" TO "service_role";



GRANT ALL ON TABLE "public"."ci_services" TO "anon";
GRANT ALL ON TABLE "public"."ci_services" TO "authenticated";
GRANT ALL ON TABLE "public"."ci_services" TO "service_role";



GRANT ALL ON TABLE "public"."ci_transaction_services" TO "anon";
GRANT ALL ON TABLE "public"."ci_transaction_services" TO "authenticated";
GRANT ALL ON TABLE "public"."ci_transaction_services" TO "service_role";



GRANT ALL ON TABLE "public"."ci_transactions" TO "anon";
GRANT ALL ON TABLE "public"."ci_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."ci_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."ci_user_businesses" TO "anon";
GRANT ALL ON TABLE "public"."ci_user_businesses" TO "authenticated";
GRANT ALL ON TABLE "public"."ci_user_businesses" TO "service_role";



GRANT ALL ON TABLE "public"."contatos" TO "anon";
GRANT ALL ON TABLE "public"."contatos" TO "authenticated";
GRANT ALL ON TABLE "public"."contatos" TO "service_role";



GRANT ALL ON TABLE "public"."difal_leads" TO "anon";
GRANT ALL ON TABLE "public"."difal_leads" TO "authenticated";
GRANT ALL ON TABLE "public"."difal_leads" TO "service_role";



GRANT ALL ON TABLE "public"."dispositivos_ec132" TO "anon";
GRANT ALL ON TABLE "public"."dispositivos_ec132" TO "authenticated";
GRANT ALL ON TABLE "public"."dispositivos_ec132" TO "service_role";



GRANT ALL ON TABLE "public"."followups" TO "anon";
GRANT ALL ON TABLE "public"."followups" TO "authenticated";
GRANT ALL ON TABLE "public"."followups" TO "service_role";



GRANT ALL ON TABLE "public"."interactions" TO "anon";
GRANT ALL ON TABLE "public"."interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."interactions" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."templates" TO "anon";
GRANT ALL ON TABLE "public"."templates" TO "authenticated";
GRANT ALL ON TABLE "public"."templates" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







