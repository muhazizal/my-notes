import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { useNotes } from '~/composables/api/useNotes'

declare const mswServer: ReturnType<typeof import('msw/node').setupServer>
declare const useToast: () => any

// UI stubs
const UButtonStub = {
	name: 'UButton',
	props: ['type', 'size', 'square', 'loading', 'disabled', 'variant', 'color'],
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
	inheritAttrs: false,
	template: `<input data-test="input" :placeholder="placeholder" @input="$emit('update:modelValue', $event?.target?.value)" />`,
}
const UTextareaStub = {
	name: 'UTextarea',
	props: ['modelValue', 'placeholder', 'size', 'ui', 'autoresize'],
	emits: ['update:modelValue'],
	inheritAttrs: false,
	template: `<textarea data-test="textarea" :placeholder="placeholder" @input="$emit('update:modelValue', $event?.target?.value)"></textarea>`,
}
const UIconStub = { name: 'UIcon', template: `<span data-test="icon"><slot /></span>` }
const NotesItemStub = {
	name: 'NotesItem',
	props: ['role'],
	template: `<div data-test="create-item" @click="$emit('click')"><slot /></div>`,
}

// AppCreateDialog stub exposing handleOpenModal
let openSpy: ReturnType<typeof vi.fn>
const AppCreateDialogStub = {
	name: 'AppCreateDialog',
	props: { title: { type: String, default: '' } },
	template: `<div data-test="dialog"><slot name="body" /></div>`,
	setup(_: any, ctx: { expose: (arg0: { handleOpenModal: (payload: any) => any }) => void }) {
		const handleOpenModal = (payload: any) => openSpy(payload)
		ctx.expose({ handleOpenModal })
		return {}
	},
}

describe('components/Notes/Create.vue', () => {
	beforeEach(() => {
		openSpy = vi.fn()
		const toast = useToast()
		toast.add.mockReset()

		// Reset shared notes state to a known baseline for each test
		const { notes } = useNotes()
		notes.value = []
	})

	const mountComp = async () => {
		const mod = await import('~/components/Notes/Create.vue')
		const Comp = mod.default
		return mount(Comp, {
			global: {
				stubs: {
					NotesItem: NotesItemStub,
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
	}

	it('clicking NotesItem opens the dialog (positive)', async () => {
		const wrapper = await mountComp()
		await wrapper.find('[data-test="create-item"]').trigger('click')
		expect(openSpy).toHaveBeenCalledWith(true)
	})

	it('v-model setter updates form fields (positive)', async () => {
		const wrapper = await mountComp()
		const vm: any = wrapper.vm
		const form = vm.form?.value ?? vm.form

		await wrapper.find('[data-test="input"]').setValue('My Title')
		await wrapper.find('[data-test="textarea"]').setValue('My Description')

		expect(form.title).toBe('My Title')
		expect(form.description).toBe('My Description')
	})

	it('handleCreateNote success adds new note, toasts, closes modal, and clears form (positive)', async () => {
		// Override POST /api/notes to return a deterministic note
		mswServer.use(
			http.post('/api/notes', () =>
				HttpResponse.json(
					{
						message: 'Success create note',
						data: {
							id: '3',
							title: 'New',
							description: 'Desc',
							raw_description: 'Desc',
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

		// Submit the form to trigger handleCreateNote
		await wrapper.find('[data-test="form"]').trigger('submit')

		// Flush microtasks and Vue updates to allow fetch + state mutation to complete
		await flushPromises()
		await wrapper.vm.$nextTick()

		// Notes list updated via shared useState('notes-list')
		const { notes } = useNotes()
		expect(notes.value[0]).toMatchObject({ id: '3', title: 'New', description: 'Desc' })

		// Toast payload
		expect(toast.add).toHaveBeenCalledWith(
			expect.objectContaining({ title: 'Create Note', description: 'Success create note' })
		)

		// Modal closed and form cleared
		expect(openSpy).toHaveBeenCalledWith(false)
		const form = (wrapper.vm as any).form?.value ?? (wrapper.vm as any).form
		expect(form.title).toBe('')
		expect(form.description).toBe('')
	})

	it('handleCreateNote early-return when loading (negative)', async () => {
		const toast = useToast()
		const wrapper = await mountComp()
		;(wrapper.vm as any).isLoadingForm = true
		await wrapper.vm.$nextTick()

		await (wrapper.vm as any).handleCreateNote()
		expect(toast.add).not.toHaveBeenCalled()
		expect(openSpy).not.toHaveBeenCalled()
	})

	it('handleCancel clears form and closes (positive)', async () => {
		const wrapper = await mountComp()
		const vm: any = wrapper.vm
		const form = vm.form?.value ?? vm.form
		form.title = 'Tmp'
		form.description = 'Tmp'

		vm.handleCancel()
		await vm.$nextTick()

		expect(form.title).toBe('')
		expect(form.description).toBe('')
		expect(openSpy).toHaveBeenCalledWith(false)
	})

	it('buttons reflect disabled and loading states (positive)', async () => {
		const wrapper = await mountComp()
		;(wrapper.vm as any).isLoadingForm = true
		await wrapper.vm.$nextTick()

		const btns = wrapper.findAll('[data-test="btn"]')
		// Identify by text content
		const cancelBtn = btns.find((b) => b.text().includes('Cancel'))!
		const createBtn = btns.find((b) => b.text().includes('Create'))!

		expect(cancelBtn.attributes('data-disabled')).toBe('true')
		expect(cancelBtn.attributes('data-loading')).toBe('false')

		expect(createBtn.attributes('data-disabled')).toBe('true')
		expect(createBtn.attributes('data-loading')).toBe('true')
	})
})
