// /app/src/app/page.tsx

import Link from "next/link";
import { CalendarDays, ListChecks, Sparkles } from "lucide-react";

import { COMPANY } from "@/brand";
import { BrandLogo } from "@/components/brand/BrandLogo";

const benefits = [
  {
    icon: CalendarDays,
    text: "Teste gratuito por até 7 dias",
  },
  {
    icon: ListChecks,
    text: "Até 30 lançamentos no teste",
  },
  {
    icon: Sparkles,
    text: "Simples de usar",
  },
];

export default function AppHomePage() {
  return (
    <main className="min-h-screen bg-[#F8FBFF] px-5 py-8 text-[#07122F]">
      <section className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-2xl items-center justify-center">
        <div className="w-full rounded-[28px] border border-[#DFE7F7] bg-white px-5 py-8 text-center shadow-xl shadow-blue-900/10 sm:px-8 sm:py-10">
          <div className="flex justify-center">
            <BrandLogo
              variant="premium-light"
              width={240}
              height={96}
              priority
            />
          </div>

          <div className="mx-auto mt-6 max-w-xl space-y-4 text-[15px] leading-7 text-[#475569] sm:text-base">
            <p className="text-lg font-semibold text-[#07122F] sm:text-xl">
              O Caixa Inteligente ajuda você a descobrir quanto realmente sobra
              para você.
            </p>

            <p>
              Em poucos minutos por dia, registre quanto recebeu e quanto
              gastou, acompanhe seu lucro real e saiba quanto precisa receber
              para atingir a meta que definiu para o seu negócio.
            </p>
          </div>

          <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3">
            <Link
              href={COMPANY.signupUrl}
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#002198] px-7 text-[15px] font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#00196F]"
            >
              Começar gratuitamente
            </Link>

            <Link
              href={COMPANY.loginUrl}
              className="inline-flex h-12 items-center justify-center rounded-full border border-[#B7D7FF] bg-white px-7 text-[15px] font-semibold text-[#002198] transition hover:border-[#002198] hover:bg-[#F8FBFF]"
            >
              Acessar meu Caixa Inteligente
            </Link>
          </div>

          <div className="mx-auto mt-8 flex flex-wrap justify-center gap-2">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <div
                  key={benefit.text}
                  className="flex items-center gap-2 whitespace-nowrap rounded-full border border-[#DFE7F7] bg-[#F8FBFF] px-4 py-2 text-[12px] font-semibold text-[#334155]"
                >
                  <Icon
                    className="shrink-0 text-[#002198]"
                    size={15}
                  />
                  <span>{benefit.text}</span>
                </div>
              );
            })}
          </div>

          <p className="mx-auto mt-6 max-w-lg text-xs leading-5 text-[#64748B] sm:text-[13px]">
            Após o teste, continue utilizando o Caixa Inteligente por apenas R$ 29,90 por mês.<br />
            Sem cartão de crédito, sem fidelidade e sem burocracia.
          </p>
        </div>
      </section>
    </main>
  );
}