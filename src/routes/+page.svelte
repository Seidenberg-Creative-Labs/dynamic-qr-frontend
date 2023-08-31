<script lang="ts">
	import ContentToggleButton from '$lib/ContentToggleButton.svelte';
	import { browser, dev } from '$app/environment';
	import { onMount, tick } from 'svelte';
	import type { Action } from 'svelte/action';
	import { PUBLIC_MODE } from '$env/static/public';
	import QRious from 'qrious';
	type Schema = {
		category: string;
		description: string;
		redirectTo: string;
	};

	let data: Record<string, Schema> = {};
	const keys = ['PLV', 'NYC', 'Generic'] as const;
	let currentTab: (typeof keys)[number] = 'PLV';
	const cache = new Map<string, typeof data>();
	onMount(async () => {
		getData(currentTab);
	});

	function changeTab(e: MouseEvent) {
		if (currentTab !== e.target?.dataset.value) {
			currentTab = e.target?.dataset.value;
			getData(currentTab);
		}
	}
	async function getData(category: string) {
		if (cache.has(category)) {
			console.log('hitting the cache');
			data = cache.get(category)!;
			console.log(data);
			return;
		}
		console.log('Querying');
		data = {};
		if (PUBLIC_MODE === 'mock') {
			let jsonData = Object.assign(
				{},
				await import('$lib/dynamic-qr-a3cee-default-rtdb-DEV-export.json').then(
					(data) => data.default satisfies Record<string, Schema>
				)
			);
			console.log('full json data', jsonData);
			for (const key of Object.keys(jsonData)) {
				if ((jsonData as Record<string, Schema>)[key].category !== category) {
					//@ts-ignore
					delete jsonData[key];
				}
			}
			console.log(jsonData);
			data = jsonData;
			cache.set(category, data);
			return;
		}
		if (PUBLIC_MODE === 'prod') {
			const url = new URL('https://dynamic-qr-a3cee-default-rtdb.firebaseio.com/DEV.json');
			url.searchParams.set('orderBy', '"category"');
			url.searchParams.set('equalTo', `\"${category}\"`);
			console.log(url.toString());
			const res = await fetch(url.toString());
			data = await res.json();
			cache.set(category, data);
		}
	}
	const genQRCode: Action<HTMLImageElement, string> = (element: HTMLImageElement, id: string) => {
		const qr = new QRious({
			value: 'http://dynamic-qr.onrender.com/r/' + id,
			size: 300
		});
		element.src = qr.toDataURL();
		return {
			update(parameter) {
				qr.value = 'http://dynamic-qr.onrender.com/r/' + parameter;
				element.src = qr.toDataURL();
			}
		};
	};

	async function add(e: SubmitEvent) {
		const form = new FormData(e.target);
		const addData: Schema = {
			category: form.get('category')!.toString(),
			description: form.get('description')!.toString(),
			redirectTo: form.get('redirectTo')!.toString()
		};
		console.log(addData);
		// console.log(patchData);
		const resp = await fetch(`https://dynamic-qr-a3cee-default-rtdb.firebaseio.com/DEV.json`, {
			method: 'POST',
			body: JSON.stringify(addData)
		});
		if (resp.status == 200) {
			const respJSON = await resp.json();
			console.log(respJSON);
			if (form.get('category') != currentTab) {
				// Invalidate the cache for that tab
				cache.delete(form.get('category')!.toString());
			} else {
				data = Object.assign(data, { [respJSON.name]: addData });
				cache.set(currentTab, data);
				getData(currentTab);
			}
			e.target.reset();
		}
	}

	async function edit(e: SubmitEvent) {
		const id = e.currentTarget.dataset.id;
		const form = new FormData(e.target);
		const patchData: Record<string, string> = {};
		for (const [key, value] of form.entries()) {
			if (data[id][key] !== value) {
				patchData[key] = value;
			}
		}
		if (Object.entries(patchData).length < 1) {
			alert('Nothing to change');
			return;
		}
		const resp = await fetch(
			`https://dynamic-qr-a3cee-default-rtdb.firebaseio.com/DEV/${id}.json`,
			{
				method: 'PATCH',
				body: JSON.stringify(patchData)
			}
		);
		console.log(resp.status);
		if (resp.status == 200) {
			alert('Successfully edited');
			if (form.get('category') != currentTab) {
				delete data[id];
				cache.delete(form.get('category')!.toString());
			} else {
				data[id] = Object.assign(data[id], patchData);
			}
			cache.set(currentTab, data);
			getData(currentTab);
		}
	}

	const appendTo: Action<HTMLElement, string | 'body'> = (elem, selector = 'body') => {
		const targetElem = document.querySelector(selector);
		if (targetElem == null) {
			return;
		}
		targetElem.appendChild(elem);
	};

	async function copyToClipboard(e: MouseEvent) {
		const id = e.currentTarget.dataset.id;
		console.log(id);
		if (!id) {
			alert("id for QR Code couldn't be copied. Contact Junior");
			return;
		}
		const elem = document.querySelector(`img[data-id="${id}"]`) as HTMLImageElement | null;
		if (!elem) {
			alert("image with matching id doesn't exist. Contact Junior to troubleshoot");
			return;
		}
		console.log(elem);
		const imageSrc = elem.src;
		const resp = await fetch(imageSrc);
		const blob = await resp.blob();
		navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]).then(
			() => {
				alert('copied to clipboard')!;
			},
			(err) => {
				alert('Something went wrong copying to clipboard\n' + err);
			}
		);
	}

	async function deleteQRCode(e: MouseEvent) {
		const hasConsented = confirm('Are you sure want to delete this?');
		if (!hasConsented) {
			return;
		}
		// console.log(e);
		// console.log(e.target)
		const id = e?.currentTarget.dataset.id;
		console.log(id);
		if (!id) {
			alert('failed to delete');
			return;
		}
		const resp = await fetch(
			`https://dynamic-qr-a3cee-default-rtdb.firebaseio.com/DEV/${id}.json`,
			{
				method: 'DELETE'
			}
		);
		console.log(resp.status);
		if (resp.status === 200) {
			delete data[id];
			cache.set(currentTab, data);
			data = data;
			alert('Deleted Successfully');
		}
	}

	const focus: Action<HTMLElement> = (target) => {
		tick().then(() => {
			target.focus();
		});
	};
</script>

<section class="container mx-auto px-6 py-4">
	<h1 class="font-bold text-3xl">QR Code</h1>
	<section>
		<h2 class="font-semibold">Create QR Code</h2>
		<form class="w-full bg-white flex flex-col gap-2" on:submit|preventDefault={add}>
			<div class="flex flex-wrap w-full gap-2">
				<div class="form-control flex-1">
					<label for="description" class="label"><span class="label-text">Name</span></label>
					<input type="text" class="input input-bordered input-sm" name="description" required />
				</div>
				<div class="form-control">
					<label class="label" for="category">
						<span class="label-text">Category</span>
					</label>
					<select class="select select-bordered select-sm w-full" name="category">
						{#each keys as key, index}
							<option value={key} selected={key === 'PLV'}>{key}</option>
						{/each}
					</select>
				</div>
			</div>
			<section class="w-full">
				<label for="redirectTo" class="label">
					<span class="label-text">Destination (url)</span>
				</label>
				<input
					type="text"
					class="input input-bordered input-sm w-full"
					name="redirectTo"
					required
				/>
			</section>
			<section>
				<button type="submit" class="btn btn-sm">Submit</button>
			</section>
		</form>
	</section>
	<hr class="my-3" />
	<div class="tabs">
		{#each keys as key}
			<button
				class="tab tab-lifted"
				class:tab-active={currentTab == key}
				data-value={key}
				on:click={changeTab}>{key}</button
			>
		{/each}
	</div>
	<ul class="space-y-1">
		{#key data}
			{#if Object.entries(data).length > 0}
				{#each Object.entries(data) as [key, info]}
					<li
						id={key}
						class="flex flex-col sm:flex-row items-center gap-2 px-1 py-2 sm:py-1 bg-gray-100 rounded-md flex-wrap"
					>
						<figure class="flex flex-col sm:flex-row items-center flex-1 gap-2">
							<img
								src=""
								alt="QR Code"
								data-id={key}
								use:genQRCode={key}
								class="w-20 object-contain"
							/>
							<figcaption class="text-base font-semibold">{info.description}</figcaption>
						</figure>
						<menu class="flex flex-col min-[320px]:flex-row justify-end sm:h-8 gap-2 rounded-md">
							<li>
								<ContentToggleButton class="btn-outline h-full min-h-fit">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
										class="w-6 h-6"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
										/>
									</svg>
									<form
										slot="content"
										class="w-full bg-white flex flex-col p-2 gap-2"
										data-id={key}
										on:submit|preventDefault={edit}
										use:appendTo={`#${key}`}
										let:toggle
									>
										<div class="flex flex-wrap w-full gap-2">
											<div class="form-control flex-1">
												<label for="description" class="label"
													><span class="label-text">Name</span></label
												>
												<input
													type="text"
													class="input input-bordered input-sm"
													name="description"
													value={info.description}
													use:focus
												/>
											</div>
											<div class="form-control">
												<label class="label" for="category">
													<span class="label-text">Category</span>
												</label>
												<select class="select select-bordered select-sm w-full" name="category">
													{#each keys as key}
														<option value={key} selected={key === currentTab}>{key}</option>
													{/each}
												</select>
											</div>
										</div>
										<section class="w-full">
											<label for="redirectTo" class="label"
												><span class="label-text">Destination (url)</span></label
											>
											<input
												type="text"
												class="input input-bordered input-sm w-full"
												name="redirectTo"
												value={info.redirectTo}
											/>
										</section>
										<section>
											<button type="submit" class="btn btn-sm">Submit</button>
											<button type="button" class="btn btn-sm" on:click={toggle}>Cancel</button>
										</section>
									</form>
								</ContentToggleButton>
							</li>
							<li>
								<button
									class="btn btn-outline h-full min-h-fit"
									data-id={key}
									on:click={copyToClipboard}
									><svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
										class="w-6 h-6"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
										/>
									</svg>
								</button>
							</li>
							<li>
								<button
									id="delete"
									class="btn btn-warning h-full min-h-fit"
									data-id={key}
									on:click={deleteQRCode}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
										class="w-6 h-6"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
										/>
									</svg>
								</button>
							</li>
						</menu>
						<!-- <div class="w-full "></div> -->
					</li>
				{/each}
			{:else}
				No QR Codes for this category
			{/if}
		{/key}
	</ul>
</section>
