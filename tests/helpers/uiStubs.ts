export const UButtonStub = {
	name: 'UButton',
	props: ['type', 'size', 'square', 'loading', 'disabled', 'variant', 'color', 'padded', 'icon'],
	emits: ['click'],
	template: `
    <button
      data-test="btn"
      :disabled="!!disabled"
      :data-disabled="!!disabled"
      :data-loading="!!loading"
      :data-icon="icon || ''"
      :type="type || 'button'"
      @click="$emit('click', $event)"
    >
      <slot />
    </button>
  `,
}

export const UFormStub = {
	name: 'UForm',
	emits: ['submit'],
	template: `
    <form data-test="form" @submit.prevent="$emit('submit', $event)">
      <slot />
    </form>
  `,
}

export const UFormGroupStub = {
	name: 'UFormGroup',
	props: ['label', 'error', 'help', 'ui'],
	template: `
    <div data-test="form-group">
      <slot />
    </div>
  `,
}

export const UInputStub = {
	name: 'UInput',
	inheritAttrs: false,
	props: ['modelValue', 'placeholder', 'size', 'class', 'type', 'ui'],
	emits: ['update:modelValue', 'keypress', 'keydown'],
	template: `
    <input
      data-test="input"
      :placeholder="placeholder || ''"
      :type="type || 'text'"
      :data-type="type || 'text'"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      @keypress="$emit('keypress', $event)"
      @keydown="$emit('keydown', $event)"
    />
  `,
}

export const UTextareaStub = {
	name: 'UTextarea',
	props: ['modelValue', 'placeholder', 'size', 'ui', 'autoresize', 'maxrows'],
	emits: ['update:modelValue'],
	template: `
    <textarea
      data-test="textarea"
      :placeholder="placeholder || ''"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  `,
}

export const UCheckboxStub = {
	name: 'UCheckbox',
	props: ['modelValue', 'label', 'ui'],
	emits: ['update:modelValue'],
	template: `
    <label>
      <input
        data-test="checkbox"
        type="checkbox"
        :checked="!!modelValue"
        @change="$emit('update:modelValue', $event.target.checked)"
      />
      <span>{{ label }}</span>
    </label>
  `,
}

export const UProgressStub = {
	name: 'UProgress',
	props: ['value', 'max', 'ui'],
	template: `
    <div data-test="progress" :data-value="value"><slot /></div>
  `,
}

export const UIconStub = {
	name: 'UIcon',
	props: ['name', 'class'],
	template: `<span data-test="icon"><slot /></span>`,
}

export const UCardStub = {
	name: 'UCard',
	template: `<div data-test="card"><slot name="header"></slot><slot /></div>`,
}

export const UModalStub = {
	name: 'UModal',
	props: ['modelValue', 'preventClose'],
	emits: ['update:modelValue'],
	template: `
    <div data-test="modal" :data-open="modelValue" v-show="modelValue">
      <slot />
    </div>
  `,
}

export const AppLogoStub = {
	name: 'AppLogo',
	template: '<div data-test="logo">Logo</div>',
}

export const UInputTrailingStub = {
	name: 'UInput',
	props: ['type', 'modelValue', 'placeholder', 'size', 'class'],
	emits: ['update:modelValue', 'keypress', 'keydown'],
	template: `
    <div data-test="input" :data-type="type || 'password'" @keypress="$emit('keypress', $event)" @keydown="$emit('keydown', $event)">
      <div v-if="$slots.trailing" data-test="trailing"><slot name="trailing" /></div>
    </div>
  `,
}

export const UDropdownStub = {
	name: 'UDropdown',
	props: {
		items: { type: Array, default: () => [] },
		popper: { type: Object, default: () => ({}) },
	},
	template: `
    <div data-test="dropdown">
      <div data-test="trigger"><slot /></div>
      <ul>
        <template v-for="(grp, gi) in items">
          <li v-for="(item, ii) in grp" :key="gi+'-'+ii">
            <button
              :data-test="'action-'+String(item.label).toLowerCase().replace(/\s+/g,'-')"
              @click="item.click && item.click()"
            >{{ item.label }}</button>
          </li>
        </template>
      </ul>
    </div>
  `,
}

export const UContainerStub = {
	name: 'UContainer',
	template: '<div data-test="container"><slot /></div>',
}

export const NotesItemStub = {
	name: 'NotesItem',
	props: ['role'],
	template:
		"<div class=\"notes-item-stub\" data-test=\"create-item\" role=\"button\" @click=\"$emit('click')\"><slot /></div>",
}

export function createAppCreateDialogStub(
	spy: (payload: boolean) => any,
	dataTest: string = 'dialog'
) {
	return {
		name: 'AppCreateDialog',
		props: { title: { type: String, default: '' } },
		template: `<div :data-test="'${dataTest}'"><slot name="body" /></div>`,
		setup(_: any, ctx: any) {
			const handleOpenModal = (payload: boolean) => spy(payload)
			ctx.expose({ handleOpenModal })
			return {}
		},
	}
}