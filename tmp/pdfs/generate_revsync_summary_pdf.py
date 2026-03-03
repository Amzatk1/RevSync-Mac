from __future__ import annotations

from pathlib import Path
import textwrap

PAGE_W = 612
PAGE_H = 792
MARGIN = 48
CONTENT_W = PAGE_W - (2 * MARGIN)


def esc(text: str) -> str:
    return text.replace('\\', r'\\').replace('(', r'\(').replace(')', r'\)')


def wrap_lines(text: str, size: float, indent: int = 0) -> list[str]:
    # Approx for Helvetica/Courier-like average character width.
    max_chars = max(20, int(CONTENT_W / (size * 0.54)) - indent)
    wrapped = textwrap.wrap(text, width=max_chars, break_long_words=False, break_on_hyphens=False)
    if not wrapped:
        return ['']
    if indent <= 0:
        return wrapped
    out = [wrapped[0]]
    cont_prefix = ' ' * indent
    for line in wrapped[1:]:
        out.append(f"{cont_prefix}{line}")
    return out


def generate_pdf(output_path: Path) -> float:
    lines: list[str] = []

    def add(op: str) -> None:
        lines.append(op)

    def draw_text(x: float, y: float, text: str, size: float = 10, font: str = 'F1') -> None:
        add('BT')
        add(f'/{font} {size} Tf')
        add(f'{x:.2f} {y:.2f} Td')
        add(f'({esc(text)}) Tj')
        add('ET')

    y = PAGE_H - MARGIN

    # Title
    draw_text(MARGIN, y, 'RevSync App Summary (Repo-Based)', size=20, font='F2')
    y -= 20
    draw_text(MARGIN, y, 'Evidence sources: README + backend/mobile/web code and docs in this repository.', size=9.2, font='F1')
    y -= 13
    add('0.75 w')
    add(f'{MARGIN} {y:.2f} m {PAGE_W - MARGIN} {y:.2f} l S')
    y -= 16

    sections = [
        (
            'What It Is',
            [
                ('p', 'RevSync is a motorcycle ECU tuning platform with a React Native/Expo mobile client, a Django REST backend, and a Next.js web app surface.'),
                ('p', 'It combines tune discovery, purchase/download, flashing workflows, and server-side safety validation/signing before customer delivery.'),
            ],
        ),
        (
            'Who It Is For',
            [
                ('b', 'Primary persona: performance-focused motorcycle riders who buy and flash ECU tunes.'),
                ('b', 'Secondary personas: tuners and admins who upload, review, publish, and support tune listings.'),
            ],
        ),
        (
            'What It Does',
            [
                ('b', 'Marketplace browsing, detail views, purchase checks, entitlements, and secure download links.'),
                ('b', 'Garage management for vehicles, ECU backups, and flash job tracking APIs.'),
                ('b', 'Guided mobile flash flow: device connect, ECU identify, backup, flash, verification, recovery, telemetry.'),
                ('b', 'Tune safety pipeline: malware scan, package/schema checks, hash checks, and ECU compatibility validation.'),
                ('b', 'Secure distribution via Ed25519 signing plus client-side signature verification before flashing.'),
                ('b', 'Auth/account/community features: JWT login/refresh, profiles, legal acceptance, preferences, follows, chat.'),
                ('b', 'Payments integration via Stripe payment-intent creation and webhook handling.'),
            ],
        ),
        (
            'How It Works (Architecture)',
            [
                ('b', 'Clients: Expo mobile app (`mobile/src/...`) and Next.js web app (`web/src/app/...`).'),
                ('b', 'API layer: Django apps (`users`, `garage`, `marketplace`, `safety_layer`, `payments`, `chat`, `tuners`).'),
                ('b', 'Data/services: SQLite default DB (optional Postgres via `DATABASE_URL`) plus Supabase auth/storage buckets.'),
                ('b', 'Async processing: Celery workers run validation/signing pipeline and move packages from quarantine to validated storage.'),
                ('b', 'Data flow: tuner upload -> quarantine -> validate/sign -> approve/publish -> purchase -> signed URL download -> mobile verify -> flash enabled.'),
                ('b', 'Desktop runtime implementation: Not found in repo (desktop README marks it as planned).'),
            ],
        ),
        (
            'How To Run (Minimal)',
            [
                ('n', '1) Backend'),
                ('c', 'cd backend && python3 -m venv venv && source venv/bin/activate'),
                ('c', 'pip install -r requirements.txt && python manage.py migrate && python manage.py runserver 0.0.0.0:8000'),
                ('n', '2) Mobile'),
                ('c', 'cd mobile && npm install && npm start'),
                ('n', '3) Web (optional)'),
                ('c', 'cd web && npm install && npm run dev'),
            ],
        ),
    ]

    for heading, items in sections:
        draw_text(MARGIN, y, heading, size=12.2, font='F2')
        y -= 14

        for kind, text in items:
            if kind == 'p':
                wrapped = wrap_lines(text, size=10.2)
                for line in wrapped:
                    draw_text(MARGIN, y, line, size=10.2, font='F1')
                    y -= 11.5
                y -= 1
            elif kind == 'b':
                wrapped = wrap_lines(f'- {text}', size=10.1, indent=2)
                for line in wrapped:
                    draw_text(MARGIN, y, line, size=10.1, font='F1')
                    y -= 11.2
                y -= 0.4
            elif kind == 'n':
                wrapped = wrap_lines(text, size=10.2)
                for line in wrapped:
                    draw_text(MARGIN, y, line, size=10.2, font='F2')
                    y -= 11.2
            elif kind == 'c':
                wrapped = wrap_lines(text, size=9.0)
                for line in wrapped:
                    draw_text(MARGIN + 10, y, line, size=9.0, font='F3')
                    y -= 10.0
            else:
                raise ValueError(kind)

        y -= 6

    draw_text(MARGIN, 28, 'Generated from repo evidence on 2026-03-03.', size=8.2, font='F1')

    content = '\n'.join(lines).encode('latin-1', errors='replace')

    objects: list[bytes] = []
    objects.append(b'<< /Type /Catalog /Pages 2 0 R >>')
    objects.append(b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
    objects.append(
        f'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PAGE_W} {PAGE_H}] '
        f'/Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> >> '
        f'/Contents 7 0 R >>'.encode('ascii')
    )
    objects.append(b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
    objects.append(b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>')
    objects.append(b'<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>')
    objects.append(f'<< /Length {len(content)} >>\nstream\n'.encode('ascii') + content + b'\nendstream')

    pdf = bytearray()
    pdf.extend(b'%PDF-1.4\n%\xe2\xe3\xcf\xd3\n')

    offsets = [0]
    for i, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f'{i} 0 obj\n'.encode('ascii'))
        pdf.extend(obj)
        pdf.extend(b'\nendobj\n')

    xref_start = len(pdf)
    pdf.extend(f'xref\n0 {len(objects) + 1}\n'.encode('ascii'))
    pdf.extend(b'0000000000 65535 f \n')
    for off in offsets[1:]:
        pdf.extend(f'{off:010d} 00000 n \n'.encode('ascii'))

    pdf.extend(
        f'trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_start}\n%%EOF\n'.encode('ascii')
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(pdf)
    return y


if __name__ == '__main__':
    out = Path('output/pdf/revsync_app_summary.pdf')
    final_y = generate_pdf(out)
    print(f'Wrote: {out.resolve()}')
    print(f'Final y-position: {final_y:.2f}')
