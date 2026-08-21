import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Controller, useForm } from 'react-hook-form'
import { X } from 'lucide-react'
import {
  addRecurringRule,
  addTransaction,
  attachReceiptToDate,
  getLatestTransaction,
  useAccounts,
  useCategories,
  useSettings,
} from '@/db/hooks'
import { generateDueRecurringTransactions } from '@/db/recurring'
import { Button } from '@/components/ui/Button'
import { ReceiptPicker } from '@/components/ReceiptPicker'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { cn } from '@/lib/utils'
import { currencySymbol } from '@/utils/currency'
import { todayISO } from '@/utils/date'
import { CategoryIcon } from '@/utils/categoryIcons'
import { frequencyLabel, RECURRING_FREQUENCIES } from '@/utils/recurring'
import { accountKindLabel } from '@/utils/accounts'
import type { Category, RecurringFrequency, TransactionType } from '@/types'

interface QuickAddValues {
  type: TransactionType
  amount: string
  categoryId: string
  date: string
  note: string
  frequency: RecurringFrequency | 'none'
  accountId: string
  transferToAccountId: string
}

const emptyValues: QuickAddValues = {
  type: 'expense',
  amount: '',
  categoryId: '',
  date: todayISO(),
  note: '',
  frequency: 'none',
  accountId: '',
  transferToAccountId: '',
}

function categoriesForType(categories: Category[], type: TransactionType) {
  return categories.filter((category) => category.type === type || category.type === 'both')
}

function pickCategory(categories: Category[], type: TransactionType, preferredId?: string) {
  const list = categoriesForType(categories, type)
  if (preferredId && list.some((category) => category.id === preferredId)) {
    return preferredId
  }
  return list[0]?.id ?? ''
}

export function TransactionForm({
  open,
  onClose,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const categories = useCategories() ?? []
  const accounts = useAccounts() ?? []
  const categoriesRef = useRef(categories)
  categoriesRef.current = categories
  const settings = useSettings()
  const currency = settings?.currency ?? 'INR'
  const symbol = currencySymbol(currency)
  const amountRef = useRef<HTMLInputElement | null>(null)
  const lastCategoryByType = useRef<Partial<Record<TransactionType, string>>>({})
  const lastAccountId = useRef<string>('')
  const dialogRef = useRef<HTMLElement | null>(null)
  const [saving, setSaving] = useState(false)
  const [receiptPhoto, setReceiptPhoto] = useState<string | undefined>()

  useFocusTrap(open, onClose, dialogRef)

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuickAddValues>({
    defaultValues: emptyValues,
  })

  const selectedType = watch('type')
  const selectedCategoryId = watch('categoryId')
  const selectedAccountId = watch('accountId')
  const creditAccounts = accounts.filter((account) => account.type === 'credit')
  const visibleCategories = useMemo(
    () => categoriesForType(categories, selectedType),
    [categories, selectedType],
  )

  const amountRegister = register('amount', {
    required: 'Enter an amount',
    validate: (value) => {
      const parsed = Number(value.replace(/,/g, '').trim())
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return 'Enter an amount greater than 0'
      }
      return true
    },
  })

  useEffect(() => {
    if (!open) return

    void (async () => {
      const [lastAny, lastExpense, lastIncome] = await Promise.all([
        getLatestTransaction(),
        getLatestTransaction('expense'),
        getLatestTransaction('income'),
      ])

      lastCategoryByType.current = {
        expense: lastExpense?.categoryId,
        income: lastIncome?.categoryId,
      }

      lastAccountId.current = lastAny?.accountId ?? accounts[0]?.id ?? ''

      const type = lastAny?.type ?? 'expense'
      const currentCategories = categoriesRef.current
      reset({
        type,
        amount: '',
        categoryId: pickCategory(
          currentCategories,
          type,
          lastCategoryByType.current[type],
        ),
        date: todayISO(),
        note: '',
        frequency: 'none',
        accountId: lastAccountId.current,
        transferToAccountId: '',
      })
      setReceiptPhoto(undefined)

      window.requestAnimationFrame(() => amountRef.current?.focus())
    })()
  }, [open, reset])

  useEffect(() => {
    if (!open || categories.length === 0) return
    const preferred = lastCategoryByType.current[selectedType]
    if (
      !selectedCategoryId ||
      !visibleCategories.some((category) => category.id === selectedCategoryId)
    ) {
      setValue('categoryId', pickCategory(categories, selectedType, preferred))
    }
  }, [
    open,
    categories,
    selectedType,
    selectedCategoryId,
    visibleCategories,
    setValue,
  ])

  useEffect(() => {
    if (!open || accounts.length === 0) return
    if (!selectedAccountId || !accounts.some((account) => account.id === selectedAccountId)) {
      setValue('accountId', lastAccountId.current || accounts[0]?.id || '')
    }
  }, [open, accounts, selectedAccountId, setValue])

  function setType(type: TransactionType) {
    setValue('type', type)
    setValue(
      'categoryId',
      pickCategory(categories, type, lastCategoryByType.current[type]),
    )
  }

  async function onSubmit(values: QuickAddValues) {
    const amount = Number(values.amount.replace(/,/g, '').trim())
    if (!values.categoryId) return
    if (accounts.length > 0 && !values.accountId) return

    setSaving(true)
    try {
      const note = values.note.trim() || undefined
      const accountId = values.accountId || undefined
      const transferToAccountId =
        values.type === 'expense' && values.transferToAccountId && values.transferToAccountId !== values.accountId
          ? values.transferToAccountId
          : undefined
      if (values.frequency === 'none') {
        await addTransaction({
          type: values.type,
          amount,
          categoryId: values.categoryId,
          date: values.date,
          note,
          receiptPhoto,
          accountId,
          transferToAccountId,
        })
      } else {
        const rule = await addRecurringRule({
          type: values.type,
          amount,
          categoryId: values.categoryId,
          note,
          frequency: values.frequency,
          startDate: values.date,
          active: true,
          accountId,
        })
        await generateDueRecurringTransactions()
        if (receiptPhoto) {
          await attachReceiptToDate(rule.id, values.date, receiptPhoto)
        }
      }
      lastCategoryByType.current[values.type] = values.categoryId
      if (values.accountId) lastAccountId.current = values.accountId
      const kind = transferToAccountId ? 'Payment' : values.type === 'income' ? 'Income' : 'Expense'
      onSaved(
        values.frequency === 'none'
          ? `${kind} saved`
          : `${frequencyLabel(values.frequency)} ${values.type} saved`,
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-40 mx-auto max-w-lg">
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-slate-900/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-add-title"
            tabIndex={-1}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-3xl bg-white shadow-2xl outline-none"
          >
            <header className="flex items-center justify-between px-5 pt-4 pb-2">
              <h2 id="quick-add-title" className="text-lg font-semibold text-slate-900">
                Add transaction
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close"
              >
                <X className="size-5" aria-hidden />
              </button>
            </header>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 pb-4">
                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-1">
                  {(['expense', 'income'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setType(type)}
                      className={cn(
                        'rounded-xl py-2.5 text-sm font-medium capitalize',
                        selectedType === type
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-500',
                      )}
                      aria-pressed={selectedType === type}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {accounts.length > 0 ? (
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">Account</span>
                    <select
                      {...register('accountId', {
                        required: accounts.length > 0 ? 'Choose an account' : false,
                      })}
                      className="w-full rounded-xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none"
                    >
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} · {accountKindLabel(account.type)}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                {selectedType === 'expense' && creditAccounts.length > 0 ? (
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">Pay toward card</span>
                    <select
                      {...register('transferToAccountId')}
                      className="w-full rounded-xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none"
                    >
                      <option value="">Not a card payment</option>
                      {creditAccounts
                        .filter((account) => account.id !== selectedAccountId)
                        .map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.name}
                          </option>
                        ))}
                    </select>
                    <p className="text-xs text-slate-400">
                      Use this when money leaves a bank account to pay a credit card. It will not count as spending.
                    </p>
                  </label>
                ) : null}

                <label className="block">
                  <span className="sr-only">Amount</span>
                  <div className="flex items-baseline gap-2 border-b border-blue-100 pb-2">
                    <span className="text-2xl font-medium text-slate-400">{symbol}</span>
                    <input
                      {...amountRegister}
                      ref={(element) => {
                        amountRegister.ref(element)
                        amountRef.current = element
                      }}
                      inputMode="decimal"
                      placeholder="0"
                      autoComplete="off"
                      aria-invalid={Boolean(errors.amount)}
                      aria-describedby={errors.amount ? 'amount-error' : undefined}
                      className="w-full bg-transparent text-4xl font-semibold tracking-tight text-slate-900 outline-none placeholder:text-slate-300"
                    />
                  </div>
                  {errors.amount ? (
                    <p id="amount-error" className="mt-2 text-sm text-red-600" role="alert">
                      {errors.amount.message}
                    </p>
                  ) : null}
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Date</span>
                  <input
                    type="date"
                    max={todayISO()}
                    {...register('date', { required: true })}
                    className="w-full rounded-xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none"
                  />
                </label>

                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium text-slate-700">Category</legend>
                  <Controller
                    control={control}
                    name="categoryId"
                    rules={{ required: 'Choose a category' }}
                    render={({ field }) => (
                      <div className="grid grid-cols-4 gap-2">
                        {visibleCategories.map((category) => {
                          const selected = field.value === category.id
                          return (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() => field.onChange(category.id)}
                              aria-pressed={selected}
                              className={cn(
                                'flex flex-col items-center gap-1.5 rounded-2xl border px-1 py-3 text-center',
                                selected
                                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                                  : 'border-blue-100 bg-white text-slate-600',
                              )}
                            >
                              <span
                                className="flex size-8 items-center justify-center rounded-full"
                                style={{
                                  backgroundColor: `${category.color}1a`,
                                  color: category.color,
                                }}
                              >
                                <CategoryIcon name={category.icon} className="size-4" />
                              </span>
                              <span className="w-full truncate text-[11px] font-medium">
                                {category.name}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  />
                  {errors.categoryId ? (
                    <p id="category-error" className="text-sm text-red-600" role="alert">
                      {errors.categoryId.message}
                    </p>
                  ) : null}
                </fieldset>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Repeat</span>
                  <select
                    {...register('frequency')}
                    className="w-full rounded-xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none"
                  >
                    <option value="none">Does not repeat</option>
                    {RECURRING_FREQUENCIES.map((frequency) => (
                      <option key={frequency} value={frequency}>
                        {frequencyLabel(frequency)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Note</span>
                  <input
                    type="text"
                    placeholder="Optional"
                    maxLength={80}
                    {...register('note')}
                    className="w-full rounded-xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </label>

                <ReceiptPicker value={receiptPhoto} onChange={setReceiptPhoto} />
              </div>

              <div className="border-t border-blue-100 px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <Button
                  type="submit"
                  disabled={saving || !selectedCategoryId}
                  className="w-full py-3"
                >
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </form>
          </motion.section>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
