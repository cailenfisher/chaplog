export type Importance = 1 | 2 | 3;

export interface Task {
	id: string;
	name: string;
	icon: string;
	importance: Importance;
	gradient: [string, string];
	encouragements: string[];
}

// Importance controls grid span:
//   3 → col-span-2 row-span-2 (big tile)
//   2 → col-span-2 row-span-1 (wide tile)
//   1 → col-span-1 row-span-1 (small tile)
//
// The 5 tasks below fill a 4-col × 3-row grid exactly:
//   Row 1-2: [Morning Meds 2×2] [Evening Meds 2×2]
//   Row 3:   [Eat Dinner 2×1]   [Wash Hands 1×1] [Get Sunlight 1×1]
export const TASKS: Task[] = [
	{
		id: 'morning-meds',
		name: 'Morning Meds',
		icon: '💊',
		importance: 3,
		gradient: ['#3730a3', '#6366f1'],
		encouragements: [
			'Great job taking your morning meds! 🌟',
			"You're so responsible! Keep it up! ✨",
			'Amazing! Your health matters so much! 💜'
		]
	},
	{
		id: 'evening-meds',
		name: 'Evening Meds',
		icon: '🌙',
		importance: 3,
		gradient: ['#4c1d95', '#7c3aed'],
		encouragements: [
			'Wonderful! Evening meds are all done! 🌙',
			"You did it! Have a peaceful night! 💫",
			"You're a superstar! All done! 🎉"
		]
	},
	{
		id: 'eat-dinner',
		name: 'Eat Dinner',
		icon: '🍽️',
		importance: 2,
		gradient: ['#78350f', '#d97706'],
		encouragements: [
			'Wonderful! Dinner is done! 🍽️✨',
			"Great job eating! You're doing amazing! 🌟",
			'Nourishing your body — good job! 💛'
		]
	},
	{
		id: 'wash-hands',
		name: 'Wash Hands',
		icon: '🧼',
		importance: 1,
		gradient: ['#164e63', '#0891b2'],
		encouragements: [
			'Squeaky clean! Amazing job! 🧼✨',
			'Clean hands, happy day! 💧',
			'So healthy! You did great! 🌊'
		]
	},
	{
		id: 'get-sunlight',
		name: 'Get Sunlight',
		icon: '☀️',
		importance: 1,
		gradient: ['#7c2d12', '#ea580c'],
		encouragements: [
			'Sunshine superstar! ☀️✨',
			"Fresh air and sunshine — you're awesome! 🌿",
			'Vitamin D done! You rock! 🌞'
		]
	}
];
