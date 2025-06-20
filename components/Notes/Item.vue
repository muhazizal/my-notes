<template>
	<div class="item">
		<slot></slot>
	</div>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
.item {
	@apply w-48 h-48 border rounded-lg flex justify-center items-center text-slate-600 transition-all;
	@apply hover:cursor-pointer hover:bg-slate-50;
	@apply active:scale-95 active:bg-slate-100;
}
</style>
