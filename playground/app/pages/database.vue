<script setup>
const loading = ref(false)
const newTodo = ref('')
const newTodoInput = ref(null)

const toast = useToast()
const { data: todos } = await useFetch('/api/todos', {
  deep: true
})

async function addTodo() {
  if (!newTodo.value.trim()) return

  loading.value = true

  try {
    const todo = await $fetch('/api/todos', {
      method: 'POST',
      body: {
        title: newTodo.value,
        completed: 0
      }
    })
    todos.value.push(todo)
    toast.add({ title: `Todo "${todo.title}" created.` })
    newTodo.value = ''
    nextTick(() => {
      newTodoInput.value?.input?.focus()
    })
  } catch (err) {
    const title = err.data?.data?.issues?.map(issue => issue.message).join('\n') || err.message
    toast.add({ title, color: 'red' })
  }
  loading.value = false
}

async function toggleTodo(todo) {
  todo.completed = Number(!todo.completed)
  await $fetch(`/api/todos/${todo.id}`, {
    method: 'PATCH',
    body: {
      completed: todo.completed
    }
  })
}

async function deleteTodo(todo) {
  await useFetch(`/api/todos/${todo.id}`, { method: 'DELETE' })
  todos.value = todos.value.filter(t => t.id !== todo.id)
  toast.add({ title: `Todo "${todo.title}" deleted.` })
}
</script>

<template>
  <UCard>
    <div class="flex items-center gap-2">
      <UButtonGroup class="flex-1" as="form" @submit.prevent="addTodo">
        <UInput
          ref="newTodoInput"
          v-model="newTodo"
          name="todo"
          :disabled="loading"
          placeholder="Make a Nuxt demo"
          autocomplete="off"
          autofocus
          :ui="{ root: 'flex-1' }"
        />

        <UButton type="submit" icon="i-lucide-plus" label="Add" :loading="loading" :disabled="newTodo.trim().length === 0" />
      </UButtonGroup>
    </div>

    <ul v-if="todos?.length" class="divide-y divide-gray-200 dark:divide-gray-800 mt-4">
      <li
        v-for="todo of todos"
        :key="todo.id"
        class="flex items-center gap-4 py-2"
      >
        <span class="flex-1 font-medium" :class="[todo.completed ? 'line-through text-gray-500' : '']">{{ todo.title }}</span>

        <USwitch size="sm" color="neutral" :model-value="Boolean(todo.completed)" @update:model-value="toggleTodo(todo)" />

        <UButton
          color="neutral"
          variant="ghost"
          size="xs"
          icon="i-lucide-trash"
          @click="deleteTodo(todo)"
        />
      </li>
    </ul>
  </UCard>
</template>
