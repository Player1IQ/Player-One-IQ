import Link from "next/link";
import { FileText } from "lucide-react";

interface ApplicationContractLinkProps {
  contractId: string;
  className?: string;
}

export function ApplicationContractLink({
  contractId,
  className = "",
}: ApplicationContractLinkProps) {
  return (
    <Link
      href={`/contracts/${contractId}`}
      className={`inline-flex items-center gap-1.5 text-xs font-medium text-accent-light hover:text-white ${className}`}
    >
      <FileText className="h-3.5 w-3.5" />
      View draft contract
    </Link>
  );
}
