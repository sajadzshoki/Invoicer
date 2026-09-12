import { useMemo, useState } from "react";
import { Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { Field, Input } from "@/components/ui/Field";
import { Button, IconButton } from "@/components/ui/Button";
import { Alert, EmptyState } from "@/components/ui/Feedback";
import { Modal } from "@/components/ui/Overlay";
import { useToast } from "@/components/ui/Toast";
import { faNum } from "@/lib/fa";
import { useInventoryStore } from "@/inventory/store";
import { useCostStore } from "@/costs/store";
import type { RegisterCostType } from "@/costs/types";
import { SettingsLayout } from "../SettingsLayout";

type CategoryTab = "products" | "expense" | "income";

/**
 * مدیریت متمرکز دسته‌بندی‌ها (فاز ۷)
 * سه گروه کاملاً جدا: کالاهای انبار، هزینه‌ها و درآمدها — هیچ‌کدام با هم
 * ادغام نمی‌شوند. حذف دستهٔ درحال‌استفاده مسدود می‌شود تا رکوردی بی‌دسته
 * نماند.
 */
export function CategoriesPage() {
  const inventory = useInventoryStore();
  const costStore = useCostStore();
  const { showToast } = useToast();

  const [tab, setTab] = useState<CategoryTab>("products");
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState("");
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const rows = useMemo(() => {
    if (tab === "products") {
      return inventory.categories.map((c) => ({
        id: c.id,
        name: c.name,
        usage: inventory.categoryUsage(c.id),
      }));
    }
    const kind: RegisterCostType = tab === "expense" ? "EXPENSE" : "INCOME";
    return costStore.categories
      .filter((c) => c.kind === kind)
      .map((c) => ({ id: c.id, name: c.name, usage: costStore.categoryUsage(c.id) }));
  }, [tab, inventory.categories, inventory.categoryUsage, costStore.categories, costStore.categoryUsage]);

  const usageNoun = tab === "products" ? "کالا/خدمت" : "رکورد";

  const addCategory = () => {
    const name = newName.trim();
    if (!name) {
      setAddError("نام دسته را وارد کنید.");
      return;
    }
    const result =
      tab === "products"
        ? inventory.addCategory(name)
        : costStore.addCategory(tab === "expense" ? "EXPENSE" : "INCOME", name);
    if (!result.ok) {
      setAddError(result.error ?? "امکان افزودن دسته وجود ندارد.");
      return;
    }
    setAddError("");
    setNewName("");
    showToast({ variant: "success", title: "دستهٔ جدید ساخته شد" });
  };

  const doRename = () => {
    if (!renameTarget) return;
    const name = renameValue.trim();
    if (!name) return;
    const result =
      tab === "products"
        ? inventory.renameCategory(renameTarget.id, name)
        : costStore.renameCategory(renameTarget.id, name);
    if (!result.ok) {
      showToast({ variant: "error", title: "نام دسته تغییر نکرد", description: result.error });
      return;
    }
    showToast({ variant: "success", title: "نام دسته به‌روز شد" });
    setRenameTarget(null);
  };

  const doDelete = () => {
    if (!deleteTarget) return;
    const result =
      tab === "products"
        ? inventory.deleteCategory(deleteTarget.id)
        : costStore.deleteCategory(deleteTarget.id);
    if (!result.ok) {
      showToast({
        variant: "error",
        title: "حذف انجام نشد",
        description:
          result.error ??
          `این دسته در ${faNum(result.usedBy ?? 0)} ${usageNoun} استفاده شده و حذف آن رکوردها را بی‌دسته می‌کند.`,
      });
      setDeleteTarget(null);
      return;
    }
    showToast({ variant: "success", title: "دسته حذف شد" });
    setDeleteTarget(null);
  };

  const tabs = [
    { id: "products", label: "کالا و خدمات", count: inventory.categories.length },
    {
      id: "expense",
      label: "هزینه",
      count: costStore.categories.filter((c) => c.kind === "EXPENSE").length,
    },
    {
      id: "income",
      label: "درآمد",
      count: costStore.categories.filter((c) => c.kind === "INCOME").length,
    },
  ];

  const deleteUsage = deleteTarget
    ? tab === "products"
      ? inventory.categoryUsage(deleteTarget.id)
      : costStore.categoryUsage(deleteTarget.id)
    : 0;

  return (
    <SettingsLayout title="دسته‌بندی‌ها" subtitle="دسته‌های کالا، هزینه و درآمد">
      <div className="settings-form">
        <Tabs
          tabs={tabs}
          active={tab}
          onChange={(id) => {
            setTab(id as CategoryTab);
            setAddError("");
          }}
          ariaLabel="گروه دسته‌بندی"
        />

        <section className="card settings-card" aria-label="افزودن دسته">
          <div className="settings-row-inline">
            <Field label="نام دستهٔ جدید" error={addError || undefined} className="grow">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="مثل: لوازم جانبی"
                onKeyDown={(e) => {
                  if (e.key === "Enter") addCategory();
                }}
              />
            </Field>
            <Button onClick={addCategory} className="settings-add-btn">
              <Plus size={18} aria-hidden /> افزودن
            </Button>
          </div>
        </section>

        <section className="card settings-card" aria-label="فهرست دسته‌ها">
          {rows.length === 0 ? (
            <EmptyState
              compact
              icon={<Tag size={40} aria-hidden />}
              title="هنوز دسته‌ای ساخته نشده"
              description="از کادر بالا اولین دسته را بسازید."
            />
          ) : (
            <ul className="settings-cat-list">
              {rows.map((row) => (
                <li key={row.id} className="settings-cat-row">
                  <div className="settings-cat-row__main">
                    <span className="settings-cat-row__name">{row.name}</span>
                    <span className="settings-cat-row__usage">
                      {faNum(row.usage)} {usageNoun}
                    </span>
                  </div>
                  <div className="settings-cat-row__actions">
                    <IconButton
                      label={`تغییر نام دستهٔ ${row.name}`}
                      onClick={() => {
                        setRenameTarget({ id: row.id, name: row.name });
                        setRenameValue(row.name);
                      }}
                    >
                      <Pencil size={18} aria-hidden />
                    </IconButton>
                    <IconButton
                      label={`حذف دستهٔ ${row.name}`}
                      onClick={() => setDeleteTarget({ id: row.id, name: row.name })}
                    >
                      <Trash2 size={18} aria-hidden />
                    </IconButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <Modal
        open={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        title="تغییر نام دسته"
        description="رکوردهای متصل به این دسته به‌صورت خودکار نام تازه را نشان می‌دهند."
        footer={
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setRenameTarget(null)}>
              انصراف
            </Button>
            <Button onClick={doRename}>ذخیره</Button>
          </div>
        }
      >
        <Field label="نام جدید">
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") doRename();
            }}
          />
        </Field>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="حذف دسته"
        description={
          deleteUsage > 0
            ? `این دسته در ${faNum(deleteUsage)} ${usageNoun} استفاده شده است و حذف آن ممکن نیست؛ اول رکوردها را به دستهٔ دیگری منتقل کنید.`
            : "این دسته هیچ رکوردی ندارد و حذف آن بی‌خطر است."
        }
        footer={
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              انصراف
            </Button>
            <Button variant="destructive" onClick={doDelete} disabled={deleteUsage > 0}>
              حذف دسته
            </Button>
          </div>
        }
      >
        {deleteUsage > 0 && (
          <Alert
            variant="warning"
            title="حذف محافظت‌شده"
            description="برای جلوگیری از بی‌دسته‌شدن رکوردها، حذف این دسته مسدود شده است."
          />
        )}
      </Modal>
    </SettingsLayout>
  );
}
