import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Crown, Ticket, X, BadgeCheck, Copy, Loader2, ChevronLeft, CheckCircle2, Printer, FolderKanban, PenTool } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { ClientPortal } from "@/components/client-portal";
import { listMyClientTickets } from "@/lib/client-tickets.functions";
import { getTicketUnreadCount } from "@/lib/client-ticket-unread";
import { getClientVipStatus } from "@/lib/client-vip.functions";
import { submitApprovalReceipt, clientListMyProjects, clientCreateTameedRequest, clientListMyTameedCodes } from "@/lib/tameed.functions";
import { getClientSession, updateMyClientProfile } from "@/lib/client.functions";
import { uploadFile } from "@/lib/files.functions";
import { validateReceiptOcr, scanReceiptFile } from "@/lib/receipt-ocr";
import { toast } from "sonner";

type ApprovedReceiptInfo = {
  receipt_id: string;
  project_name: string;
  paid_amount: number;
  approved_at: string;
};

type ClientInstallment = {
  id?: string | number;
  number: number;
  amount: number;
  paid_amount: number;
  status: string;
};

function getInstallmentState(status: string): "due" | "paid" | "disabled" {
  const normalized = status.trim().toLowerCase();
  if (normalized === "paid" || normalized === "مدفوع") return "paid";
  if (normalized === "disabled" || normalized === "inactive" || normalized === "معطل") return "disabled";
  return "due";
}

function isActiveTameedStatus(status: string): boolean {
  return !["مكتمل", "ملغي", "cancelled", "completed", "complete", "used"].includes(status.trim().toLowerCase());
}

export function ClientPortalShell() {
  const listTickets = useServerFn(listMyClientTickets);</think><tool_call>Bash<arg_key>command</arg_key><arg_value>wc -l /tmp/cc-agent/72033264/.v3/persisted-tool-results/v3-session/call_b969f39b97b249adb1b9fbb7.txt