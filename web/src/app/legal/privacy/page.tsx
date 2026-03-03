import LegalDocumentTemplate from '@/components/legal/LegalDocumentTemplate';
import { LEGAL_DOCS } from '@/lib/legalContent';

export default function PrivacyPage() {
    return <LegalDocumentTemplate doc={LEGAL_DOCS.privacy} />;
}
