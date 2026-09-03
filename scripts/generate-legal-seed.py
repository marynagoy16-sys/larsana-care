#!/usr/bin/env python3
"""Gera migration SQL com conteúdo v1.0 dos DOCX jurídicos."""
from __future__ import annotations

import re
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "supabase" / "migrations" / "20260903130000_legal_documents_seed_v1.sql"

DOC_MAP: list[tuple[str, Path, str, str, str, str, bool]] = [
    # term_type, file, title, profile, acceptance_mode, version, is_current
    (
        "TERMO_USO_PP",
        ROOT / "DOC PP" / "TERMOS DE USO DA PLATAFORMA — PROFISSIONAIS PARCEIROS FISIOTERAPEUTAS.docx",
        "Termos de Uso — Profissionais Parceiros",
        "pp",
        "express",
        "1.0-2026-08",
        True,
    ),
    (
        "LGPD_PP",
        ROOT / "DOC PP" / "POLÍTICA DE PRIVACIDADE — PROFISSIONAIS PARCEIROS.docx",
        "Política de Privacidade — Profissionais Parceiros",
        "pp",
        "express",
        "1.0-2026-08",
        True,
    ),
    (
        "ANEXO_I_COMERCIAL_PP",
        ROOT / "DOC PP" / "ANEXO I — REGRAS COMERCIAIS DOS PROFISSIONAIS PARCEIROS — FISIOTERAPIA.docx",
        "Anexo I — Regras Comerciais PP",
        "pp",
        "awareness",
        "1.0-2026-08",
        True,
    ),
    (
        "ANEXO_II_OPERACIONAL_PP",
        ROOT / "DOC PP" / "ANEXO II — REGRAS OPERACIONAIS DOS PROFISSIONAIS PARCEIROS — FISIOTERAPIA.docx",
        "Anexo II — Regras Operacionais PP",
        "pp",
        "awareness",
        "1.0-2026-08",
        True,
    ),
    (
        "ANEXO_III_CATEGORIAS_PP",
        ROOT / "DOC PP" / "ANEXO III — CATEGORIAS TÉCNICAS E HABILITAÇÕES — FISIOTERAPIA.docx",
        "Anexo III — Categorias Técnicas e Habilitações",
        "pp",
        "express",
        "1.0-2026-08",
        True,
    ),
    (
        "ANEXO_IV_SIGILO_PP",
        ROOT / "DOC PP" / "ANEXO IV — TERMO_POLÍTICA DE SIGILO, CONFIDENCIALIDADE E DADOS ASSISTENCIAIS.docx",
        "Anexo IV — Sigilo e Dados Assistenciais",
        "pp",
        "express",
        "1.0-2026-08",
        True,
    ),
    (
        "TERMO_ADESAO",
        ROOT / "DOC Paciente" / "Termos de Uso Paciente_Responsável.docx",
        "Termos de Uso — Paciente/Responsável",
        "paciente",
        "express",
        "1.0-2026-08",
        True,
    ),
    (
        "LGPD",
        ROOT / "DOC Paciente" / "POLÍTICA DE PRIVACIDADE - PACIENTES, FAMILIARES E RESPONSÁVEIS — LARSANA CARE.docx",
        "Política de Privacidade — Pacientes",
        "paciente",
        "express",
        "1.0-2026-08",
        True,
    ),
    (
        "AVISO_DADOS_SAUDE",
        ROOT / "DOC Paciente" / "AVISO ESPECÍFICO DE TRATAMENTO DE DADOS PESSOAIS E DADOS DE SAÚDE.docx",
        "Aviso Específico — Dados de Saúde",
        "paciente",
        "awareness",
        "1.0-2026-08",
        True,
    ),
    (
        "ANEXO_I_COMERCIAL_PACIENTE",
        ROOT / "DOC Paciente" / "ANEXO I — CONDIÇÕES COMERCIAIS E TABELA DE VALORES.docx",
        "Anexo I — Condições Comerciais",
        "paciente",
        "express",
        "1.0-2026-08",
        True,
    ),
    (
        "ANEXO_II_CANCELAMENTO_PACIENTE",
        ROOT / "DOC Paciente" / "ANEXO II — REGRAS DE CANCELAMENTO, REAGENDAMENTO, AUSÊNCIA, PAUSA E ENCERRAMENTO DO TRATAMENTO.docx",
        "Anexo II — Cancelamento e Reagendamento",
        "paciente",
        "awareness",
        "1.0-2026-08",
        True,
    ),
    (
        "ANEXO_III_ESCOPO_PACIENTE",
        ROOT / "DOC Paciente" / "ANEXO III — ESCOPO E LIMITES DE ATUAÇÃO DOS PROFISSIONAIS PARCEIROS LARSANA CARE.docx",
        "Anexo III — Escopo dos Profissionais Parceiros",
        "paciente",
        "awareness",
        "1.0-2026-08",
        True,
    ),
    (
        "TCLE_FISIO",
        ROOT / "DOC Paciente" / "TCLE Fisioterapia - LARSANA CARE.docx",
        "TCLE — Fisioterapia Domiciliar",
        "paciente",
        "express",
        "1.0-2026-08",
        True,
    ),
    (
        "AUTORIZACAO_FAMILIAR",
        ROOT / "DOC Paciente" / "TERMO DE RESPONSABILIDADE E AUTORIZAÇÃO DO FAMILIAR_RESPONSÁVEL LARSANA CARE.docx",
        "Autorização Familiar",
        "paciente",
        "express",
        "1.0-2026-08",
        True,
    ),
    (
        "REPRESENTACAO_LEGAL",
        ROOT / "DOC Paciente" / "TERMO DE REPRESENTAÇÃO OU ASSISTÊNCIA LEGAL DO PACIENTE.docx",
        "Representação Legal",
        "paciente",
        "express",
        "1.0-2026-08",
        True,
    ),
]


def extract_docx(path: Path) -> str:
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml").decode("utf-8", errors="replace")
    text = re.sub(r"</w:p>", "\n", xml)
    text = re.sub(r"<[^>]+>", "", text)
    text = (
        text.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", '"')
        .replace("&apos;", "'")
    )
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def dollar_quote(text: str) -> str:
    tag = "legal_body"
    while f"${tag}$" in text:
        tag += "_x"
    return f"${tag}${text}${tag}$"


def main() -> None:
    lines = [
        "-- Seed v1.0 documentos jurídicos (mapa Larsana Care — Ago/2026)",
        "-- Gerado por scripts/generate-legal-seed.py",
        "",
        "-- Desativa versões antigas dos tipos que recebem conteúdo completo",
        "UPDATE public.legal_terms SET is_current = false",
        "WHERE term_type IN (",
        "  'TERMO_ADESAO', 'DIRETRIZES', 'LGPD', 'DIRETRIZES_PP', 'LGPD_PP',",
        "  'CONTRATO_INTERMEDIACAO', 'TERMO_CONSENTIMENTO'",
        ") AND is_current = true;",
        "",
    ]

    for term_type, path, title, profile, mode, version, is_current in DOC_MAP:
        if not path.exists():
            raise FileNotFoundError(path)
        content = extract_docx(path)
        lines.append(
            f"INSERT INTO public.legal_terms "
            f"(term_type, version, title, content, is_current, profile, acceptance_mode, status, effective_at)"
        )
        lines.append(
            f"VALUES ("
            f"'{term_type}', '{version}', '{title.replace(chr(39), chr(39)+chr(39))}', "
            f"{dollar_quote(content)}, {str(is_current).lower()}, "
            f"'{profile}'::public.legal_term_profile, "
            f"'{mode}'::public.legal_acceptance_mode, "
            f"'vigente'::public.legal_term_status, "
            f"'2026-08-01'::timestamptz"
            f")"
        )
        lines.append(
            "ON CONFLICT (term_type, version) DO UPDATE SET "
            "title = EXCLUDED.title, content = EXCLUDED.content, is_current = EXCLUDED.is_current, "
            "profile = EXCLUDED.profile, acceptance_mode = EXCLUDED.acceptance_mode, "
            "status = EXCLUDED.status, effective_at = EXCLUDED.effective_at;"
        )
        lines.append("")

    # Aliases: manter DIRETRIZES_PP apontando para conteúdo TERMO_USO_PP
    lines.extend(
        [
            "-- Alias legado DIRETRIZES_PP → mesmo conteúdo TERMO_USO_PP",
            "UPDATE public.legal_terms SET is_current = false WHERE term_type = 'DIRETRIZES_PP' AND is_current = true;",
            "INSERT INTO public.legal_terms (term_type, version, title, content, is_current, profile, acceptance_mode, status, effective_at)",
            "SELECT 'DIRETRIZES_PP', version, 'Diretrizes — Profissionais (legado)', content, true, profile, acceptance_mode, status, effective_at",
            "FROM public.legal_terms WHERE term_type = 'TERMO_USO_PP' AND version = '1.0-2026-08'",
            "ON CONFLICT (term_type, version) DO UPDATE SET content = EXCLUDED.content, is_current = EXCLUDED.is_current;",
            "",
            "-- TCLE alias legado TERMO_CONSENTIMENTO",
            "UPDATE public.legal_terms SET is_current = false WHERE term_type = 'TERMO_CONSENTIMENTO' AND is_current = true;",
            "INSERT INTO public.legal_terms (term_type, version, title, content, is_current, profile, acceptance_mode, status, effective_at)",
            "SELECT 'TERMO_CONSENTIMENTO', version, 'Termo de Consentimento (legado)', content, true, profile, acceptance_mode, status, effective_at",
            "FROM public.legal_terms WHERE term_type = 'TCLE_FISIO' AND version = '1.0-2026-08'",
            "ON CONFLICT (term_type, version) DO UPDATE SET content = EXCLUDED.content, is_current = EXCLUDED.is_current;",
            "",
            "-- Política de Cookies (placeholder até peça jurídica)",
            "INSERT INTO public.legal_terms (term_type, version, title, content, is_current, profile, acceptance_mode, status, effective_at, requires_reaccept)",
            "VALUES (",
            "  'POLITICA_COOKIES', '1.0-2026-08', 'Política de Cookies',",
            "  'Utilizamos cookies essenciais para autenticação e preferências. Cookies analíticos são opcionais e podem ser gerenciados nas preferências do site.',",
            "  true, 'publico'::public.legal_term_profile, 'awareness'::public.legal_acceptance_mode,",
            "  'vigente'::public.legal_term_status, '2026-08-01'::timestamptz, false",
            ")",
            "ON CONFLICT (term_type, version) DO UPDATE SET content = EXCLUDED.content, is_current = EXCLUDED.is_current;",
        ]
    )

    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
