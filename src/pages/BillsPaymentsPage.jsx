import {
  CreditCard,
  TrendingDown,
  Info,
  Calendar,
  AlertCircle,
  Plus,
  Trash2
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useDately } from "@/context/DatelyContext";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";

export default function BillsPaymentsPage() {
  const { obligations, toggleObligationStatus, deleteObligation, isLoaded, navigateTo, t } = useDately();

  if (!isLoaded) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-dately-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Filter for financial commitments (where amount > 0)
  const bills = (obligations || []).filter((ob) => ob && ob.amount !== undefined && Number(ob.amount) > 0);
  
  const pendingAmount = bills.filter((ob) => ob?.status === "Pending").reduce((sum, ob) => sum + (Number(ob?.amount) || 0), 0);
  const completedAmount = bills.filter((ob) => ob?.status === "Completed").reduce((sum, ob) => sum + (Number(ob?.amount) || 0), 0);
  const totalAmount = pendingAmount + completedAmount;

  const categories = ["Rent", "EMI", "Bill", "Subscription", "Renewal", "Other"];
  const categorySummary = categories
    .map((cat) => {
      const catBills = bills.filter((ob) => ob.category === cat);
      const amount = catBills.reduce((sum, ob) => sum + (Number(ob.amount) || 0), 0);
      const percentage = totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0;
      return { name: cat, amount, percentage };
    })
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  return (
    <DashboardLayout>
      <div className="space-y-6 text-left">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-dately-navy">{t('bills_title')}</h1>
            <p className="text-sm text-dately-slate mt-1">
              {t('bills_subtitle')}
            </p>
          </div>
          <Button
            onClick={() => navigateTo("obligation-add")}
            variant="primary"
            size="sm"
            className="flex items-center self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>{t('bills_add')}</span>
          </Button>
        </div>

        {/* Commitment Summary Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-dately-secondary">
            <CardBody className="p-5 sm:p-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-dately-slate block">
                  {t('bills_pending')}
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-dately-navy mt-1 block font-mono">
                  ₹{pendingAmount.toLocaleString()}
                </span>
              </div>
              <div className="w-12 h-12 bg-dately-secondary/10 rounded-xl flex items-center justify-center text-dately-secondary">
                <AlertCircle className="w-6 h-6" />
              </div>
            </CardBody>
          </Card>
          <Card className="border-l-4 border-l-dately-success">
            <CardBody className="p-5 sm:p-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-dately-slate block">
                  {t('bills_paid')}
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-dately-navy mt-1 block font-mono">
                  ₹{completedAmount.toLocaleString()}
                </span>
              </div>
              <div className="w-12 h-12 bg-dately-success/10 rounded-xl flex items-center justify-center text-dately-success">
                <TrendingDown className="w-6 h-6" />
              </div>
            </CardBody>
          </Card>
          <Card className="border-l-4 border-l-dately-primary">
            <CardBody className="p-5 sm:p-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-dately-slate block">
                  {t('bills_total')}
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-dately-navy mt-1 block font-mono">
                  ₹{totalAmount.toLocaleString()}
                </span>
              </div>
              <div className="w-12 h-12 bg-dately-primary/10 rounded-xl flex items-center justify-center text-dately-primary">
                <CreditCard className="w-6 h-6" />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Categories Outflow Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category Breakdown (Span 1) */}
          <div className="bg-white border border-dately-border rounded-2xl shadow-sm p-6 text-left h-fit">
            <h3 className="font-extrabold text-slate-900 text-base sm:text-lg pb-3 border-b border-slate-100 mb-4">
              {t('bills_spending')}
            </h3>
            {categorySummary.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center font-medium">No bill outflows tracked yet.</p>
            ) : (
              <div className="space-y-4 font-sans text-sm">
                {categorySummary.map((cat) => (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-slate-900 text-sm font-bold">{cat.name}</span>
                      <span className="text-slate-600 font-mono text-xs sm:text-sm font-semibold">
                        ₹{cat.amount.toLocaleString()} ({cat.percentage}%)
                      </span>
                    </div>
                    <ProgressBar progress={cat.percentage} color="primary" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bills Checklist (Span 2) */}
          <div className="lg:col-span-2 bg-white border border-dately-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-dately-navy/25 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center font-sans">
                <Calendar className="w-5 h-5 mr-2 text-dately-primary" />
                <span>{t('bills_commitments')}</span>
              </h3>
              <span className="text-xs text-slate-500 font-semibold">Click checkbox to record paid status</span>
            </div>

            <div className="divide-y divide-dately-border">
              {bills.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500 font-medium">{t('bills_empty')}</div>
              ) : (
                bills.map((ob) => (
                  <div
                    key={ob.id}
                    className={`p-4 sm:p-5 flex items-center justify-between transition-colors hover:bg-slate-50/20 ${
                      ob.status === "Completed" ? "bg-green-50/10" : ""
                    }`}
                  >
                    <div className="flex items-start space-x-3.5 text-left min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={ob.status === "Completed"}
                        onChange={() => toggleObligationStatus(ob.id)}
                        className="mt-1 rounded text-dately-primary focus:ring-dately-primary cursor-pointer w-4.5 h-4.5"
                      />
                      <div className="min-w-0">
                        <span
                          className={`text-sm sm:text-base font-bold block truncate ${
                            ob.status === "Completed" ? "line-through text-slate-400" : "text-slate-900"
                          }`}
                        >
                          {ob.name}
                        </span>
                        <div className="flex items-center space-x-2 mt-1.5 flex-wrap gap-y-1">
                          <Badge variant={ob.status === "Completed" ? "success" : "warning"} className="text-xs px-2 py-0.5">
                            {ob.status === "Completed" ? "Paid" : "Pending"}
                          </Badge>
                          <span className="text-xs text-slate-600 font-medium">
                            Category: {ob.category} • Repeat: {ob.repeat}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 pl-4 flex-shrink-0 text-right">
                      <div>
                        <span className="text-sm sm:text-base font-bold text-slate-900 block font-mono">
                          ₹{ob.amount ? Number(ob.amount).toLocaleString() : "N/A"}
                        </span>
                        <span className="text-xs text-slate-600 mt-0.5 block font-sans font-medium">
                          Due Date: {ob.dueDate}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteObligation(ob.id)}
                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-dately-danger rounded-lg transition-colors bg-transparent border-0 cursor-pointer"
                        title="Delete Bill"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom info banner */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-dately-border flex items-start space-x-3 text-xs sm:text-sm text-slate-700 font-sans text-left">
              <Info className="w-5 h-5 text-dately-primary mt-0.5 flex-shrink-0" />
              <p className="leading-relaxed font-medium">
                {t('bills_info_banner')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
