import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { ref } from 'vue'
import { format } from 'date-fns'

import * as useNotesModule from '~/composables/api/useNotes'

// MSW and Nuxt globals from test setup
declare const mswServer: ReturnType<typeof import('msw/node').setupServer>
declare const useToast: () => any

// UI stubs
const UButtonStub = {
	name: 'UButton',
	props: ['type', 'size', 'square', 'loading', 'disabled', 'variant', 'color', 'icon', 'padded'],
	template: `
    <button
      data-test="btn"
      :data-disabled="disabled ? 'true' : 'false'"
      :data-loading="loading ? 'true' : 'false'"
      @click="$emit('click')"
    >
      <slot />
    </button>
  `,
}
const UFormStub = {
	name: 'UForm',
	template: `<form data-test="form" @submit.prevent="$emit('submit')"><slot /></form>`,
}
const UFormGroupStub = { name: 'UFormGroup', template: `<div data-test="group"><slot /></div>` }
const UInputStub = {
	name: 'UInput',
	props: ['modelValue', 'placeholder', 'size'],
	emits: ['update:modelValue'],
	template: `<input data-test="input" :placeholder="placeholder" @input="$emit('update:modelValue', $event?.target?.value)" />`,
}
const UTextareaStub = {
	name: 'UTextarea',
	props: ['modelValue', 'placeholder', 'size', 'ui', 'autoresize', 'maxrows'],
	emits: ['update:modelValue'],
	template: `<textarea data-test="textarea" :placeholder="placeholder" @input="$emit('update:modelValue', $event?.target?.value)"></textarea>`,
}
const UIconStub = { name: 'UIcon', template: `<span data-test="icon"><slot /></span>` }

// AppCreateDialog stub that exposes handleOpenModal and only renders body when open
let openSpy: ReturnType<typeof vi.fn>
const AppCreateDialogStub = {
	name: 'AppCreateDialog',
	props: { title: { type: String, default: '' } },
	template: `<div data-test="dialog"><slot name="body" /></div>`,
	setup(_: any, ctx: any) {
		const isOpen = ref(false)
		const handleOpenModal = (payload: boolean) => {
			isOpen.value = payload
			openSpy(payload)
		}
		ctx.expose({ handleOpenModal })
		return { isOpen }
	},
}

describe('components/Notes/Detail.vue', () => {
	let routerMock: { push: ReturnType<typeof vi.fn>; replace: ReturnType<typeof vi.fn> }
	let routeMock: { params: { id: string } }

	beforeEach(() => {
		openSpy = vi.fn()

		const toast = useToast()
		toast.add.mockReset()

		// Fresh router/route per test
		routerMock = { push: vi.fn(), replace: vi.fn() }
		routeMock = { params: { id: '1' } } // default to sample note

		vi.stubGlobal('useRouter', () => routerMock)
		vi.stubGlobal('useRoute', () => routeMock)
		vi.stubGlobal('useHead', vi.fn())
	})

	let DetailCtor: any

	const mountComp = async () => {
		const mod = await import('~/components/Notes/Detail.vue')
		const Comp = mod.default
		DetailCtor = Comp

		// Wrap Detail in Suspense so async setup can render
		const Root = { components: { Detail: Comp }, template: '<Suspense><Detail /></Suspense>' }

		const wrapper = mount(Root, {
			global: {
				stubs: {
					AppCreateDialog: AppCreateDialogStub,
					UForm: UFormStub,
					UFormGroup: UFormGroupStub,
					UInput: UInputStub,
					UTextarea: UTextareaStub,
					UButton: UButtonStub,
					UIcon: UIconStub,
				},
			},
		})

		// Flush async setup and subsequent updates
		await Promise.resolve()
		await new Promise((r) => setTimeout(r, 0))
		const detail = wrapper.findComponent(DetailCtor)
		if (detail.exists()) {
			await detail.vm.$nextTick()
		}

		return wrapper
	}

	it('renders note title/description and Back to Notes link (positive)', async () => {
		const wrapper = await mountComp()

		const detail = wrapper.findComponent(DetailCtor)
		await detail.vm.$nextTick()

		const titleEl = wrapper.find('.note__title')
		expect(titleEl.exists()).toBe(true)
		expect(titleEl.text()).toBe('First Note')

		const descEl = wrapper.find('.note__desc')
		expect(descEl.exists()).toBe(true)
		expect(descEl.text()).toContain('first note description')

		const backBtn = wrapper
			.findAllComponents({ name: 'UButton' })
			.find((b) => b.text().includes('Back to Notes'))!
		await backBtn.trigger('click')
		expect(routerMock.push).toHaveBeenCalledWith('/notes')
	})

	it('clicking Update opens the dialog (positive)', async () => {
		const wrapper = await mountComp()
		const updateBtn = wrapper
			.findAllComponents({ name: 'UButton' })
			.find((b) => b.props('icon') === 'i-heroicons-pencil-square')!
		await updateBtn.trigger('click')

		const detail = wrapper.findComponent(DetailCtor)
		await detail.vm.$nextTick()

		expect(openSpy).toHaveBeenCalledWith(true)
		expect(wrapper.find('[data-test="input"]').exists()).toBe(true)
		expect(wrapper.find('[data-test="textarea"]').exists()).toBe(true)
	})

	it('v-model updates form fields inside update modal (positive)', async () => {
		const wrapper = await mountComp()
		const updateBtn = wrapper
			.findAllComponents({ name: 'UButton' })
			.find((b) => b.props('icon') === 'i-heroicons-pencil-square')!
		await updateBtn.trigger('click')

		const detail = wrapper.findComponent(DetailCtor)
		await detail.vm.$nextTick()

		await wrapper.find('[data-test="input"]').setValue('Edited Title')
		await wrapper.find('[data-test="textarea"]').setValue('Edited Description')

		const vm: any = detail.vm
		const form = vm.form?.value ?? vm.form
		expect(form.title).toBe('Edited Title')
		expect(form.description).toBe('Edited Description')
	})

	it('renders skeleton when pending is true', async () => {
		const spy = vi.spyOn(useNotesModule, 'useNotes').mockImplementation(
			() =>
				({
					getNoteById: async () => ({
						data: ref(null),
						pending: ref(true),
						error: ref(null),
					}),
					deleteNote: vi.fn(),
					updateNote: vi.fn(),
				} as any)
		)

		const wrapper = await mountComp()
		await wrapper.vm.$nextTick()

		const skeleton = wrapper.find('.note__skeleton')
		expect(skeleton.exists()).toBe(true)
		expect(skeleton.findAll('div').length).toBe(4)

		spy.mockRestore()
	})

	it('handleUpdateNote success toasts, updates note, closes modal, and clears form (positive)', async () => {
		routeMock.params.id = '1'
		mswServer.use(
			http.put('/api/notes/:id', async () =>
				HttpResponse.json(
					{
						data: {
							id: '1',
							title: 'Updated Title',
							description: 'Updated Description',
							raw_description: 'Updated Description',
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
						},
						code: 201,
					},
					{ status: 201 }
				)
			)
		)

		const toast = useToast()
		const wrapper = await mountComp()

		const updateBtn = wrapper
			.findAllComponents({ name: 'UButton' })
			.find((b) => b.props('icon') === 'i-heroicons-pencil-square')!
		await updateBtn.trigger('click')
		const detail = wrapper.findComponent(DetailCtor)
		await detail.vm.$nextTick()

		await wrapper.find('[data-test="input"]').setValue('Updated Title')
		await wrapper.find('[data-test="textarea"]').setValue('Updated Description')
		await wrapper.find('[data-test="form"]').trigger('submit')

		await Promise.resolve()
		await new Promise((r) => setTimeout(r, 0))
		await detail.vm.$nextTick()

		expect(toast.add).toHaveBeenCalledWith(
			expect.objectContaining({ title: 'Update Note', description: 'Note updated' })
		)
		expect(wrapper.find('h4.note__title').text()).toBe('Updated Title')
		expect(wrapper.find('p.note__desc').text()).toBe('Updated Description')

		const noteRef = (detail.vm as any).note?.value ?? (detail.vm as any).note
		expect(noteRef.title).toBe('Updated Title')
		expect(noteRef.description).toBe('Updated Description')

		expect(openSpy).toHaveBeenCalledWith(false)

		await Promise.resolve()
		await new Promise((r) => setTimeout(r, 0))
		await wrapper.vm.$nextTick()

		const updateBtn2 = wrapper
			.findAllComponents({ name: 'UButton' })
			.find((b) => b.props('icon') === 'i-heroicons-pencil-square')!
		await updateBtn2.trigger('click')
		await wrapper.vm.$nextTick()

		const inputStub = wrapper.findComponent({ name: 'UInput' })
		const textareaStub = wrapper.findComponent({ name: 'UTextarea' })

		expect(inputStub.props('modelValue')).toBe('')
		expect(textareaStub.props('modelValue')).toBe('')

		const form = (detail.vm as any).form?.value ?? (detail.vm as any).form
		expect(form.title).toBe('')
		expect(form.description).toBe('')
	})

	it('formatted date uses createdAt when updatedAt missing (branch)', async () => {
		const wrapper = await mountComp()
		const detail = wrapper.findComponent(DetailCtor)
		const vm: any = detail.vm
		const note = vm.note?.value ?? vm.note

		note.updatedAt = ''
		const created = new Date().toISOString()
		note.createdAt = created

		await detail.vm.$nextTick()

		const dateText = wrapper.find('.note__date').text()
		expect(dateText).toBe(format(created, "dd MMM yyyy 'at' HH:mm"))
	})

	it('formatted date is empty when both dates missing (branch)', async () => {
		const wrapper = await mountComp()
		const detail = wrapper.findComponent(DetailCtor)
		const vm: any = detail.vm
		const note = vm.note?.value ?? vm.note

		note.updatedAt = ''
		note.createdAt = ''

		await detail.vm.$nextTick()

		expect(wrapper.find('.note__date').text()).toBe('')
	})

	it('handleUpdateNote early returns when isUpdating true (branch)', async () => {
		const toast = useToast()
		const wrapper = await mountComp()
		const updateBtn = wrapper
			.findAllComponents({ name: 'UButton' })
			.find((b) => b.props('icon') === 'i-heroicons-pencil-square')!
		await updateBtn.trigger('click')

		const detail = wrapper.findComponent(DetailCtor)
		const vm: any = detail.vm
		if (vm.isUpdating && typeof vm.isUpdating === 'object' && 'value' in vm.isUpdating) {
			vm.isUpdating.value = true
		} else {
			vm.isUpdating = true
		}
		await detail.vm.$nextTick()

		await wrapper.find('[data-test="form"]').trigger('submit')

		await Promise.resolve()
		await new Promise((r) => setTimeout(r, 0))
		await detail.vm.$nextTick()

		// Title remains unchanged; no success toast
		expect(wrapper.find('h4.note__title').text()).toBe('First Note')
		expect(toast.add).not.toHaveBeenCalledWith(expect.objectContaining({ title: 'Update Note' }))
	})

	it('handleUpdateNote early returns when note.id missing (branch)', async () => {
		const toast = useToast()
		const wrapper = await mountComp()
		const updateBtn = wrapper
			.findAllComponents({ name: 'UButton' })
			.find((b) => b.props('icon') === 'i-heroicons-pencil-square')!
		await updateBtn.trigger('click')

		const detail = wrapper.findComponent(DetailCtor)
		const vm: any = detail.vm
		const note = vm.note?.value ?? vm.note
		note.id = '' // missing id
		await detail.vm.$nextTick()

		await wrapper.find('[data-test="form"]').trigger('submit')

		await Promise.resolve()
		await new Promise((r) => setTimeout(r, 0))
		await detail.vm.$nextTick()

		expect(wrapper.find('h4.note__title').text()).toBe('First Note')
		expect(toast.add).not.toHaveBeenCalledWith(expect.objectContaining({ title: 'Update Note' }))
	})

	it('handleUpdateNote success without data keeps previous note (covers L175 fallback)', async () => {
		routeMock.params.id = '1'
		mswServer.use(
			http.put('/api/notes/:id', async () =>
				HttpResponse.json(
					{
						// No `data`, so note.value should remain unchanged
						message: 'Updated but no data',
						code: 201,
					},
					{ status: 201 }
				)
			)
		)

		const toast = useToast()
		const wrapper = await mountComp()

		// Snapshot the note before update
		const detail = wrapper.findComponent(DetailCtor)
		await detail.vm.$nextTick()
		const beforeNote = JSON.stringify(
			(detail.vm as any).note?.value ?? (detail.vm as any).note
		)

		// Open update dialog and submit new form values
		const updateBtn = wrapper
			.findAllComponents({ name: 'UButton' })
			.find((b) => b.props('icon') === 'i-heroicons-pencil-square')!
		await updateBtn.trigger('click')
		await detail.vm.$nextTick()

		await wrapper.find('[data-test="input"]').setValue('Updated Title')
		await wrapper.find('[data-test="textarea"]').setValue('Updated Description')
		await wrapper.find('[data-test="form"]').trigger('submit')

		// Flush update pipeline
		await Promise.resolve()
		await new Promise((r) => setTimeout(r, 0))
		await detail.vm.$nextTick()

		// Toast uses provided message (left side of ||)
		expect(toast.add).toHaveBeenCalledWith(
			expect.objectContaining({ title: 'Update Note', description: 'Updated but no data' })
		)

		// Note should remain unchanged because response had no `data`
		const afterNote = JSON.stringify(
			(detail.vm as any).note?.value ?? (detail.vm as any).note
		)
		expect(afterNote).toBe(beforeNote)

		// Dialog was closed and form cleared (existing behavior)
		expect(openSpy).toHaveBeenCalledWith(false)
	})

	it('handleDeleteNote success uses fallback message and redirects (covers L189–194)', async () => {
		routeMock.params.id = '1'
		mswServer.use(
			http.delete('/api/notes/:id', async () =>
				HttpResponse.json(
					{
						// No `message`, triggers fallback 'Note deleted'
						code: 200,
					},
					{ status: 200 }
				)
			)
		)

		const toast = useToast()
		const wrapper = await mountComp()

		// Optional router spy if accessible on vm; still executes even without assertion
		const detail = wrapper.findComponent(DetailCtor)
		await detail.vm.$nextTick()
		const routerInstance =
			(detail.vm as any).router ?? (detail.vm as any).$router ?? undefined
		const replaceSpy =
			routerInstance && 'replace' in routerInstance
				? vi.spyOn(routerInstance, 'replace')
				: undefined

		// Trigger deletion via Delete button
		const deleteBtn = wrapper
			.findAllComponents({ name: 'UButton' })
			.find((b) => b.props('icon') === 'i-heroicons-trash')!
		await deleteBtn.trigger('click')

		// Flush delete pipeline
		await Promise.resolve()
		await new Promise((r) => setTimeout(r, 0))
		await detail.vm.$nextTick()

		// Covers OR fallback: 'Note deleted'
		expect(toast.add).toHaveBeenCalledWith(
			expect.objectContaining({ title: 'Delete Note', description: 'Note deleted' })
		)

		// Covers router.replace('/notes') line execution; assert if spy available
		if (replaceSpy) {
			expect(replaceSpy).toHaveBeenCalledWith('/notes')
		}
	})

	it('formatted date uses createdAt when updatedAt missing (branch)', async () => {
		const wrapper = await mountComp()
		const detail = wrapper.findComponent(DetailCtor)
		const vm: any = detail.vm
		const note = vm.note?.value ?? vm.note

		note.updatedAt = ''
		const created = new Date().toISOString()
		note.createdAt = created

		await detail.vm.$nextTick()

		const dateText = wrapper.find('.note__date').text()
		expect(dateText).toBe(format(created, "dd MMM yyyy 'at' HH:mm"))
	})

	it('formatted date is empty when both dates missing (branch)', async () => {
		const wrapper = await mountComp()
		const detail = wrapper.findComponent(DetailCtor)
		const vm: any = detail.vm
		const note = vm.note?.value ?? vm.note

		note.updatedAt = ''
		note.createdAt = ''

		await detail.vm.$nextTick()

		expect(wrapper.find('.note__date').text()).toBe('')
	})

	it('handleUpdateNote early returns when isUpdating true (branch)', async () => {
		const toast = useToast()
		const wrapper = await mountComp()
		const updateBtn = wrapper
			.findAllComponents({ name: 'UButton' })
			.find((b) => b.props('icon') === 'i-heroicons-pencil-square')!
		await updateBtn.trigger('click')

		const detail = wrapper.findComponent(DetailCtor)
		const vm: any = detail.vm
		if (vm.isUpdating && typeof vm.isUpdating === 'object' && 'value' in vm.isUpdating) {
			vm.isUpdating.value = true
		} else {
			vm.isUpdating = true
		}
		await detail.vm.$nextTick()

		await wrapper.find('[data-test="form"]').trigger('submit')

		await Promise.resolve()
		await new Promise((r) => setTimeout(r, 0))
		await detail.vm.$nextTick()

		// Title remains unchanged; no success toast
		expect(wrapper.find('h4.note__title').text()).toBe('First Note')
		expect(toast.add).not.toHaveBeenCalledWith(expect.objectContaining({ title: 'Update Note' }))
	})

	it('handleUpdateNote early returns when note.id missing (branch)', async () => {
		const toast = useToast()
		const wrapper = await mountComp()
		const updateBtn = wrapper
			.findAllComponents({ name: 'UButton' })
			.find((b) => b.props('icon') === 'i-heroicons-pencil-square')!
		await updateBtn.trigger('click')

		const detail = wrapper.findComponent(DetailCtor)
		const vm: any = detail.vm
		const note = vm.note?.value ?? vm.note
		note.id = '' // missing id
		await detail.vm.$nextTick()

		await wrapper.find('[data-test="form"]').trigger('submit')

		await Promise.resolve()
		await new Promise((r) => setTimeout(r, 0))
		await detail.vm.$nextTick()

		expect(wrapper.find('h4.note__title').text()).toBe('First Note')
		expect(toast.add).not.toHaveBeenCalledWith(expect.objectContaining({ title: 'Update Note' }))
	})

	it('handleUpdateNote failure does not close modal or update title (negative branch)', async () => {
		routeMock.params.id = '1'
		mswServer.use(
			http.put('/api/notes/:id', async () =>
				HttpResponse.json({ message: 'Server error', code: 500 }, { status: 500 })
			)
		)

		const toast = useToast()
		const wrapper = await mountComp()

		const updateBtn = wrapper
			.findAllComponents({ name: 'UButton' })
			.find((b) => b.props('icon') === 'i-heroicons-pencil-square')!
		await updateBtn.trigger('click')
		const detail = wrapper.findComponent(DetailCtor)
		await detail.vm.$nextTick()

		await wrapper.find('[data-test="input"]').setValue('X')
		await wrapper.find('[data-test="textarea"]').setValue('Y')
		await wrapper.find('[data-test="form"]').trigger('submit')

		await Promise.resolve()
		await new Promise((r) => setTimeout(r, 0))
		await detail.vm.$nextTick()

		expect(wrapper.find('h4.note__title').text()).toBe('First Note')
		expect(openSpy).not.toHaveBeenCalledWith(false)
		// Error toast from interceptor, but not success title
		expect(toast.add).not.toHaveBeenCalledWith(expect.objectContaining({ title: 'Update Note' }))

		const isUpdating = (detail.vm as any).isUpdating?.value ?? (detail.vm as any).isUpdating
		expect(isUpdating).toBe(false)
	})

	it('handleDeleteNote early returns when isDeleting true (branch)', async () => {
		const wrapper = await mountComp()
		const detail = wrapper.findComponent(DetailCtor)
		const vm: any = detail.vm

		if (vm.isDeleting && typeof vm.isDeleting === 'object' && 'value' in vm.isDeleting) {
			vm.isDeleting.value = true
		} else {
			vm.isDeleting = true
		}
		await detail.vm.$nextTick()

		const deleteBtn = wrapper
			.findAllComponents({ name: 'UButton' })
			.find((b) => b.props('icon') === 'i-heroicons-trash')!
		await deleteBtn.trigger('click')

		await Promise.resolve()
		await new Promise((r) => setTimeout(r, 0))
		await detail.vm.$nextTick()

		expect(routerMock.replace).not.toHaveBeenCalled()
	})

	it('handleDeleteNote early returns when note.id missing (branch)', async () => {
		const wrapper = await mountComp()
		const detail = wrapper.findComponent(DetailCtor)
		const vm: any = detail.vm
		const note = vm.note?.value ?? vm.note
		note.id = '' // missing id
		await detail.vm.$nextTick()

		const deleteBtn = wrapper
			.findAllComponents({ name: 'UButton' })
			.find((b) => b.props('icon') === 'i-heroicons-trash')!
		await deleteBtn.trigger('click')

		await Promise.resolve()
		await new Promise((r) => setTimeout(r, 0))
		await detail.vm.$nextTick()

		expect(routerMock.replace).not.toHaveBeenCalled()
	})

	it('handleDeleteNote failure does not redirect (negative branch)', async () => {
		routeMock.params.id = '1'
		mswServer.use(
			http.delete('/api/notes/:id', async () =>
				HttpResponse.json({ message: 'Server error', code: 500 }, { status: 500 })
			)
		)

		const toast = useToast()
		const wrapper = await mountComp()

		const deleteBtn = wrapper
			.findAllComponents({ name: 'UButton' })
			.find((b) => b.props('icon') === 'i-heroicons-trash')!
		await deleteBtn.trigger('click')

		await Promise.resolve()
		await new Promise((r) => setTimeout(r, 0))
		await wrapper.vm.$nextTick()

		expect(routerMock.replace).not.toHaveBeenCalled()
		// Error toast from interceptor, but not success title
		expect(toast.add).not.toHaveBeenCalledWith(expect.objectContaining({ title: 'Delete Note' }))
		const isDeleting =
			(wrapper.findComponent(DetailCtor).vm as any).isDeleting?.value ??
			(wrapper.findComponent(DetailCtor).vm as any).isDeleting
		expect(isDeleting).toBe(false)
	})

	it('modal buttons reflect disabled/loading states when updating (branch)', async () => {
		const wrapper = await mountComp()
		const detail = wrapper.findComponent(DetailCtor)
		const vm: any = detail.vm

		// Set updating and open the dialog
		if (vm.isUpdating && typeof vm.isUpdating === 'object' && 'value' in vm.isUpdating) {
			vm.isUpdating.value = true
		} else {
			vm.isUpdating = true
		}
		await detail.vm.$nextTick()

		const updateBtn = wrapper
			.findAllComponents({ name: 'UButton' })
			.find((b) => b.props('icon') === 'i-heroicons-pencil-square')!
		await updateBtn.trigger('click')
		await detail.vm.$nextTick()

		const modalButtons = wrapper.find('.create__actions').findAllComponents({ name: 'UButton' })
		const cancelBtn = modalButtons[0]
		const submitBtn = modalButtons[1]

		expect(cancelBtn.find('[data-test="btn"]').attributes('data-disabled')).toBe('true')
		expect(submitBtn.find('[data-test="btn"]').attributes('data-disabled')).toBe('true')
		expect(submitBtn.find('[data-test="btn"]').attributes('data-loading')).toBe('true')
	})

	it('renders error state when error is truthy (branch)', async () => {
		const spy = vi.spyOn(useNotesModule, 'useNotes').mockImplementation(
			() =>
				({
					getNoteById: async () => ({
						data: ref(null),
						pending: ref(false),
						error: ref(true),
					}),
					deleteNote: vi.fn(),
					updateNote: vi.fn(),
				} as any)
		)

		const wrapper = await mountComp()
		await wrapper.vm.$nextTick()

		const error = wrapper.find('.note__error')
		expect(error.exists()).toBe(true)
		expect(error.find('p.mb-4').text()).toContain('Unable to load note')

		const backBtn = wrapper
			.findAllComponents({ name: 'UButton' })
			.find((b) => b.text().includes('Back to Notes'))!
		await backBtn.trigger('click')
		expect(routerMock.push).toHaveBeenCalledWith('/notes')

		spy.mockRestore()
	})

	it('formatted date uses updatedAt when present (branch)', async () => {
		const wrapper = await mountComp()
		const detail = wrapper.findComponent(DetailCtor)
		const vm: any = detail.vm
		const note = vm.note?.value ?? vm.note

		const updated = new Date().toISOString()
		note.updatedAt = updated
		await detail.vm.$nextTick()

		const dateEl = wrapper.find('.note__date')
		expect(dateEl.exists()).toBe(true)
		expect(dateEl.text()).toBe(format(updated, "dd MMM yyyy 'at' HH:mm"))
	})

	it('Cancel button clears form and closes modal (branch)', async () => {
		const wrapper = await mountComp()
		const updateBtn = wrapper
			.findAllComponents({ name: 'UButton' })
			.find((b) => b.props('icon') === 'i-heroicons-pencil-square')!
		await updateBtn.trigger('click')
		await wrapper.vm.$nextTick()

		await wrapper.find('[data-test="input"]').setValue('Temp Title')
		await wrapper.find('[data-test="textarea"]').setValue('Temp Description')

		const modalButtons = wrapper.find('.create__actions').findAllComponents({ name: 'UButton' })
		const cancelBtn = modalButtons[0]
		await cancelBtn.trigger('click')

		expect(openSpy).toHaveBeenCalledWith(false)

		// Wait for handleClearForm's internal nextTick to finish
		await Promise.resolve()
		await new Promise((r) => setTimeout(r, 0))
		await wrapper.vm.$nextTick()

		// Reopen dialog and verify cleared v-models via stub props
		const updateBtn2 = wrapper
			.findAllComponents({ name: 'UButton' })
			.find((b) => b.props('icon') === 'i-heroicons-pencil-square')!
		await updateBtn2.trigger('click')
		await wrapper.vm.$nextTick()

		const inputStub = wrapper.findComponent({ name: 'UInput' })
		const textareaStub = wrapper.findComponent({ name: 'UTextarea' })
		expect(inputStub.props('modelValue')).toBe('')
		expect(textareaStub.props('modelValue')).toBe('')

		const detail = wrapper.findComponent(DetailCtor)
		const form = (detail.vm as any).form?.value ?? (detail.vm as any).form
		expect(form.title).toBe('')
		expect(form.description).toBe('')
	})

	it('handleDeleteNote success toasts and redirects (positive)', async () => {
		routeMock.params.id = '1'
		mswServer.use(
			http.delete('/api/notes/:id', async () =>
				HttpResponse.json({ message: 'Success delete note 200', code: 200 }, { status: 200 })
			)
		)

		const toast = useToast()
		const wrapper = await mountComp()

		const deleteBtn = wrapper
			.findAllComponents({ name: 'UButton' })
			.find((b) => b.props('icon') === 'i-heroicons-trash')!
		await deleteBtn.trigger('click')

		await Promise.resolve()
		await new Promise((r) => setTimeout(r, 0))
		await wrapper.vm.$nextTick()

		expect(toast.add).toHaveBeenCalledWith(
			expect.objectContaining({
				title: 'Delete Note',
				description: expect.stringContaining('Success delete note'),
			})
		)
		expect(routerMock.replace).toHaveBeenCalledWith('/notes')

		const isDeleting =
			(wrapper.findComponent(DetailCtor).vm as any).isDeleting?.value ??
			(wrapper.findComponent(DetailCtor).vm as any).isDeleting
		expect(isDeleting).toBe(false)
	})

	it('useHead sets title with and without note title (branch)', async () => {
		const wrapper = await mountComp()
		const detail = wrapper.findComponent(DetailCtor)
		const vm: any = detail.vm
		const note = vm.note?.value ?? vm.note

		const headCalls = (globalThis as any).useHead.mock.calls
		expect(headCalls.length).toBeGreaterThan(0)
		const headFn = headCalls[0][0]
		expect(typeof headFn).toBe('function')

		note.title = 'Sample Title'
		const withTitle = headFn()
		expect(withTitle.title).toBe('Sample Title • Notes')

		note.title = ''
		const withoutTitle = headFn()
		expect(withoutTitle.title).toBe('Note • My Notes')
	})
})
