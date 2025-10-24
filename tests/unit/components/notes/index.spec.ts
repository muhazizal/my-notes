import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Index from '~/components/Notes/Index.vue'

describe('components/Notes/Index.vue', () => {
  const NotesCreateStub = {
    name: 'NotesCreate',
    template: '<div class="notes-create-stub">Create</div>',
  }
  const NotesListStub = {
    name: 'NotesList',
    template: '<div class="notes-list-stub">List</div>',
  }

  it('renders container and child components', async () => {
    const wrapper = mount(Index, {
      global: {
        stubs: {
          NotesCreate: NotesCreateStub,
          NotesList: NotesListStub,
        },
      },
    })

    // Container with Tailwind classes
    const container = wrapper.get('div.flex.flex-row.gap-5.flex-wrap')

    // Child stubs rendered inside container
    const create = container.find('.notes-create-stub')
    const list = container.find('.notes-list-stub')
    expect(create.exists()).toBe(true)
    expect(list.exists()).toBe(true)
  })

  it('renders children in correct order: Create then List', async () => {
    const wrapper = mount(Index, {
      global: {
        stubs: {
          NotesCreate: NotesCreateStub,
          NotesList: NotesListStub,
        },
      },
    })

    const container = wrapper.get('div.flex.flex-row.gap-5.flex-wrap')
    const children = Array.from(container.element.children)
    expect(children.length).toBe(2)
    expect(children[0].classList.contains('notes-create-stub')).toBe(true)
    expect(children[1].classList.contains('notes-list-stub')).toBe(true)
  })
})