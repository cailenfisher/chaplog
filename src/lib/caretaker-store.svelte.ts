import { MOCK_VIPS, type VipSummary, type ReportTask } from './mock-caretaker';

class CaretakerStore {
	vips = $state<VipSummary[]>(structuredClone(MOCK_VIPS));

	addVip(data: { display_name: string; activeThemeId: string }) {
		this.vips.push({
			id: crypto.randomUUID(),
			display_name: data.display_name,
			activeThemeId: data.activeThemeId,
			tasks: [],
			completions: []
		});
	}

	updateVip(id: string, data: { display_name: string; activeThemeId: string }) {
		const vip = this.vips.find((v) => v.id === id);
		if (!vip) return;
		vip.display_name = data.display_name;
		vip.activeThemeId = data.activeThemeId;
	}

	removeVip(id: string) {
		const i = this.vips.findIndex((v) => v.id === id);
		if (i >= 0) this.vips.splice(i, 1);
	}

	addTask(vipId: string, data: { name: string; icon: string; importance: 1 | 2 | 3 }) {
		const vip = this.vips.find((v) => v.id === vipId);
		if (!vip) return;
		vip.tasks.push({
			id: `${vipId}-${crypto.randomUUID().slice(0, 8)}`,
			name: data.name,
			icon: data.icon,
			importance: data.importance
		});
	}

	updateTask(
		vipId: string,
		taskId: string,
		data: { name: string; icon: string; importance: 1 | 2 | 3 }
	) {
		const task = this.vips.find((v) => v.id === vipId)?.tasks.find((t) => t.id === taskId);
		if (!task) return;
		task.name = data.name;
		task.icon = data.icon;
		task.importance = data.importance;
	}

	softDeleteTask(vipId: string, taskId: string) {
		const task = this.vips.find((v) => v.id === vipId)?.tasks.find((t) => t.id === taskId);
		if (!task) return;
		task.deletedAt = new Date().toISOString();
	}

	restoreTask(vipId: string, taskId: string) {
		const task = this.vips.find((v) => v.id === vipId)?.tasks.find((t) => t.id === taskId);
		if (!task) return;
		delete task.deletedAt;
	}
}

export const store = new CaretakerStore();
