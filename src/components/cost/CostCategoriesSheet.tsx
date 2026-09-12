import { useEffect, useState } from "react";
import { Check, Pencil, Plus, Tags, Trash2, X } from "lucide-react";
import { BottomSheet, Modal } from "@/components/ui/Overlay";
import { Button, IconButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { SegmentedControl } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { useCostStore } from "@/costs/store";
import type { RegisterCostType } from "@/costs/types";
import { faNum } from "@/lib/fa";

export interface CostCategoriesSheetProps {
  open: boolean;
  onClose: () => void;
  onPicked?: (categoryId: string) => void;
}

/** مدیریت دسته‌های هزینه و درآمد — افزودن، تغییر نام و حذف امن */
export function CostCategoriesSheet({ open, onClose, onPicked }: CostCategoriesSheetProps) {
  const store = useCostStore();
  const { categories } = store;
  const { showToast } = useToast();

  const [kind, setKind] = useState<RegisterCostType>("EXPENSE");
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState<string | undefined>();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState<string | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setEditingId(null);
      setNewName("");
      setAddError(undefined);
    }
  }, [open]);

  const list = categories.filter((c) => c.kind === kind);

  const addNew = () => {
    const result = store.addCategory(kind, newName);
    if (!result.ok) {
      setAddError(result.error);
      return;
    }
    setAddError(undefined);
    setNewName("");
    showToast({ variant: "success", title: "دستهٔ جدید ساخته شد" });
  };

  const saveRename = (id: string) => {
    const result = store.renameCategory(id, editName);
    if (!result.ok) {
      setEditError(result.error);
      return;
    }
    setEditingId(null);
    setEditError(undefined);
    showToast({ variant: "success", title: "نام دسته به‌روزرسانی شد" });
  };

  const requestDelete = (id: string) => {
    const usedBy = store.categoryUsage(id);
    if (usedBy > 0) {
      showToast({
        variant: "warning",
        title: "این دسته در حال استفاده است",
        description: `${faNum(usedBy)} رکورد از این دسته استفاده می‌کنند؛ اول آن‌ها را به دستهٔ دیگری منتقل کنید.`,
      });
      return;
    }
    setDeleteId(id);
  };

  const deleteCat = categories.find((c) => c.id === deleteId);

  return (
    <>
      <BottomSheet open={open} onClose={onClose} title="مدیریت دسته‌ها">
        <SegmentedControl
          ariaLabel="نوع دسته‌ها"
          active={kind}
          onChange={(v) => {
            setKind(v as RegisterCostType);
            setEditingId(null);
          }}
          items={[
            { id: "EXPENSE", label: "دسته‌های هزینه" },
            { id: "INCOME", label: "دسته‌های درآمد" },
          ]}
        />

        {/* افزودن دستهٔ جدید */}
        <div className="cat-add">
          <Input
            value={newName}
            invalid={!!addError}
            placeholder={kind === "EXPENSE" ? "نام دستهٔ هزینه؛ مثل بیمه" : "نام دستهٔ درآمد؛ مثل مشاوره"}
            aria-label="نام دستهٔ جدید"
            onChange={(e) => {
              setNewName(e.target.value);
              setAddError(undefined);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newName.trim()) addNew();
            }}
          />
          <Button
            icon={<Plus size={18} aria-hidden />}
            onClick={addNew}
            disabled={!newName.trim()}
          >
            افزودن
          </Button>
        </div>
        {addError && (
          <p className="field__error" role="alert">{addError}</p>
        )}

        {/* فهرست دسته‌ها */}
        <div className="list mt-2">
          {list.length === 0 && (
            <p className="text-center text-muted text-sm" style={{ padding: "16px 0" }}>
              هنوز دسته‌ای ساخته نشده است.
            </p>
          )}
          {list.map((cat) => {
            const usage = store.categoryUsage(cat.id);
            const isEditing = editingId === cat.id;
            return (
              <div key={cat.id} className="list-item">
                <span className="list-item__icon" aria-hidden>
                  <Tags size={18} />
                </span>
                {isEditing ? (
                  <span className="list-item__body">
                    <Input
                      value={editName}
                      invalid={!!editError}
                      aria-label="نام جدید دسته"
                      onChange={(e) => {
                        setEditName(e.target.value);
                        setEditError(undefined);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && editName.trim()) saveRename(cat.id);
                      }}
                    />
                    {editError && (
                      <span className="field__error" role="alert">{editError}</span>
                    )}
                  </span>
                ) : (
                  <span className="list-item__body">
                    <span className="list-item__title">{cat.name}</span>
                    <span className="list-item__caption">
                      {usage > 0 ? `${faNum(usage)} رکورد در این دسته` : "بدون استفاده"}
                    </span>
                  </span>
                )}
                <span className="list-item__end">
                  {isEditing ? (
                    <>
                      <IconButton label="ذخیرهٔ نام" size="sm" tone="tint" onClick={() => saveRename(cat.id)}>
                        <Check size={16} aria-hidden />
                      </IconButton>
                      <IconButton
                        label="انصراف"
                        size="sm"
                        onClick={() => {
                          setEditingId(null);
                          setEditError(undefined);
                        }}
                      >
                        <X size={16} aria-hidden />
                      </IconButton>
                    </>
                  ) : (
                    <>
                      <IconButton
                        label={`تغییر نام ${cat.name}`}
                        size="sm"
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditName(cat.name);
                          setEditError(undefined);
                        }}
                      >
                        <Pencil size={16} aria-hidden />
                      </IconButton>
                      <IconButton
                        label={`حذف ${cat.name}`}
                        size="sm"
                        onClick={() => requestDelete(cat.id)}
                      >
                        <Trash2 size={16} aria-hidden />
                      </IconButton>
                      {onPicked && (
                        <Button
                          variant="text"
                          size="sm"
                          onClick={() => {
                            onPicked(cat.id);
                            onClose();
                          }}
                        >
                          انتخاب
                        </Button>
                      )}
                    </>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </BottomSheet>

      {/* تأیید حذف دستهٔ بدون استفاده */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="حذف دسته؟"
        description={`دستهٔ «${deleteCat?.name ?? ""}» حذف می‌شود. این عمل قابل بازگشت نیست.`}
        footer={
          <>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteId) {
                  const result = store.deleteCategory(deleteId);
                  if (!result.ok && result.usedBy) {
                    showToast({
                      variant: "warning",
                      title: "حذف انجام نشد",
                      description: result.error,
                    });
                  } else {
                    showToast({ variant: "success", title: "دسته حذف شد" });
                  }
                }
                setDeleteId(null);
              }}
            >
              حذف دسته
            </Button>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              انصراف
            </Button>
          </>
        }
      />
    </>
  );
}
