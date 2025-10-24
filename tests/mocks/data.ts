import type { IUser } from '~/types/user'
import type { INote } from '@/types/notes'

export const now = new Date().toISOString()

export const sampleUser: IUser = {
	email: 'a@b.com',
	fullname: 'Test User',
	isVerified: true,
	username: 'tester',
}

export const sampleNotes: INote[] = [
	{
		id: '1',
		title: 'First Note',
		description: 'This is the first note description.',
		raw_description: 'This is the first note description.',
		createdAt: now,
		updatedAt: now,
	},
	{
		id: '2',
		title: 'Second Note',
		description: 'This is the second note description.',
		raw_description: 'This is the second note description.',
		createdAt: now,
		updatedAt: now,
	},
]