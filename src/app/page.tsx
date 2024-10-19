'use client'

import React, { useState, useRef, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { Menu, Plus, Share2, MoreVertical, CheckSquare, Edit2 } from 'lucide-react'
import { nanoid } from 'nanoid'

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type Task = {
  id: string
  content: string
  checklist: { id: string; text: string; checked: boolean }[]
}

type Column = {
  id: string
  title: string
  taskIds: string[]
}

type Project = {
  id: string
  title: string
  columns: Column[]
  tasks: { [key: string]: Task }
}

export default function ProjectManager() {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 'project-1',
      title: 'Project 1',
      columns: [
        { id: 'column-1', title: 'To Do', taskIds: ['task-1'] },
        { id: 'column-2', title: 'In Progress', taskIds: [] },
        { id: 'column-3', title: 'Done', taskIds: [] },
      ],
      tasks: {
        'task-1': {
          id: 'task-1',
          content: 'Task 1',
          checklist: [
            { id: 'check-1', text: 'Subtask 1', checked: false },
            { id: 'check-2', text: 'Subtask 2', checked: true },
          ],
        },
      },
    },
  ])
  const [currentProject, setCurrentProject] = useState(projects[0])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newProjectName, setNewProjectName] = useState('')
  const [newColumnName, setNewColumnName] = useState('')
  const [newTaskName, setNewTaskName] = useState('')
  const [newSubtaskName, setNewSubtaskName] = useState('')
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false)
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false)
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState<string | null>(null)
  const [isAddSubtaskDialogOpen, setIsAddSubtaskDialogOpen] = useState<string | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [editingId])

  const onDragEnd = (result: any) => {
    const { destination, source, draggableId, type } = result;
  
    // If there's no destination (e.g., dropped outside a droppable area), do nothing
    if (!destination) {
      return;
    }
  
    // If the item is dropped in the same place, do nothing
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
  
    // Handle column reordering
    if (type === 'column') {
      const newColumnOrder = Array.from(currentProject.columns);
      const [reorderedColumn] = newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, reorderedColumn);
  
      const updatedProject = {
        ...currentProject,
        columns: newColumnOrder,
      };
  
      setCurrentProject(updatedProject);
      setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
      return;
    }
  
    // Handle task reordering within a column
    const startColumn = currentProject.columns.find(col => col.id === source.droppableId);
    const finishColumn = currentProject.columns.find(col => col.id === destination.droppableId);
  
    if (!startColumn || !finishColumn) return;  // Ensure columns exist
  
    // Moving task within the same column
    if (startColumn === finishColumn) {
      const newTaskIds = Array.from(startColumn.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);
  
      const newColumn = {
        ...startColumn,
        taskIds: newTaskIds,
      };
  
      const newColumns = currentProject.columns.map(col =>
        col.id === newColumn.id ? newColumn : col
      );
  
      const updatedProject = {
        ...currentProject,
        columns: newColumns,
      };
  
      setCurrentProject(updatedProject);
      setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
    } 
    // Moving task between different columns
    else {
      const startTaskIds = Array.from(startColumn.taskIds);
      startTaskIds.splice(source.index, 1);
  
      const newStartColumn = {
        ...startColumn,
        taskIds: startTaskIds,
      };
  
      const finishTaskIds = Array.from(finishColumn.taskIds);
      finishTaskIds.splice(destination.index, 0, draggableId);
  
      const newFinishColumn = {
        ...finishColumn,
        taskIds: finishTaskIds,
      };
  
      const newColumns = currentProject.columns.map(col => {
        if (col.id === newStartColumn.id) return newStartColumn;
        if (col.id === newFinishColumn.id) return newFinishColumn;
        return col;
      });
  
      const updatedProject = {
        ...currentProject,
        columns: newColumns,
      };
  
      setCurrentProject(updatedProject);
      setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
    }
  };
  

  const addProject = () => {
    if (newProjectName.trim() === '') return
    const newProject: Project = {
      id: nanoid(),
      title: newProjectName,
      columns: [
        { id: nanoid(), title: 'To Do', taskIds: [] },
        { id: nanoid(), title: 'In Progress', taskIds: [] },
        { id: nanoid(), title: 'Done', taskIds: [] },
      ],
      tasks: {},
    }
    setProjects([...projects, newProject])
    setCurrentProject(newProject)
    setNewProjectName('')
    setIsAddProjectDialogOpen(false)
  }

  const addColumn = () => {
    if (newColumnName.trim() === '') return
    const newColumn: Column = {
      id: nanoid(),
      title: newColumnName,
      taskIds: [],
    }
    const updatedProject = {
      ...currentProject,
      columns: [...currentProject.columns, newColumn],
    }
    setCurrentProject(updatedProject)
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p))
    setNewColumnName('')
    setIsAddColumnDialogOpen(false)
  }

  const addTask = (columnId: string) => {
    if (newTaskName.trim() === '') return
    const newTaskId = nanoid()
    const newTask: Task = {
      id: newTaskId,
      content: newTaskName,
      checklist: [],
    }
    const updatedProject = {
      ...currentProject,
      tasks: { ...currentProject.tasks, [newTaskId]: newTask },
      columns: currentProject.columns.map(col =>
        col.id === columnId ? { ...col, taskIds: [...col.taskIds, newTaskId] } : col
      ),
    }
    setCurrentProject(updatedProject)
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p))
    setNewTaskName('')
    setIsAddTaskDialogOpen(null)
  }

  const addChecklistItem = (taskId: string) => {
    if (newSubtaskName.trim() === '') return
    const updatedProject = {
      ...currentProject,
      tasks: {
        ...currentProject.tasks,
        [taskId]: {
          ...currentProject.tasks[taskId],
          checklist: [
            ...currentProject.tasks[taskId].checklist,
            { id: nanoid(), text: newSubtaskName, checked: false },
          ],
        },
      },
    }
    setCurrentProject(updatedProject)
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p))
    setNewSubtaskName('')
    setIsAddSubtaskDialogOpen(null)
  }

  const toggleChecklistItem = (taskId: string, checklistItemId: string) => {
    const updatedProject = {
      ...currentProject,
      tasks: {
        ...currentProject.tasks,
        [taskId]: {
          ...currentProject.tasks[taskId],
          checklist: currentProject.tasks[taskId].checklist.map(item =>
            item.id === checklistItemId ? { ...item, checked: !item.checked } : item
          ),
        },
      },
    }
    setCurrentProject(updatedProject)
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p))
  }

  const startEditing = (id: string) => {
    setEditingId(id)
  }

  const handleEdit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const newName = e.currentTarget.value
      if (editingId === 'project-title') {
        const updatedProject = {
          ...currentProject,
          title: newName,
        }
        setCurrentProject(updatedProject)
        setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p))
      } else if (editingId?.startsWith('column-')) {
        const updatedProject = {
          ...currentProject,
          columns: currentProject.columns.map(col =>
            col.id === editingId ? { ...col, title: newName } : col
          ),
        }
        setCurrentProject(updatedProject)
        setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p))
      } else if (editingId?.startsWith('task-')) {
        const updatedProject = {
          ...currentProject,
          tasks: {
            ...currentProject.tasks,
            [editingId]: {
              ...currentProject.tasks[editingId],
              content: newName,
            },
          },
        }
        setCurrentProject(updatedProject)
        setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p))
      } else if (editingId?.startsWith('check-')) {
        const [taskId, checklistItemId] = editingId.split('|')
        const updatedProject = {
          ...currentProject,
          tasks: {
            ...currentProject.tasks,
            [taskId]: {
              ...currentProject.tasks[taskId],
              checklist: currentProject.tasks[taskId].checklist.map(item =>
                item.id === checklistItemId ? { ...item, text: newName } : item
              ),
            },
          },
        }
        setCurrentProject(updatedProject)
        setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p))
      }
      setEditingId(null)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, addFunction: () => void) => {
    if (e.key === 'Enter') {
      addFunction();
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <nav className="flex items-center justify-between p-4 bg-primary text-primary-foreground">
        <div className="flex items-center">
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold">Projects</h2>
                {projects.map(project => (
                  <Button
                    key={project.id}
                    variant="ghost"
                    className="justify-start"
                    onClick={() => {
                      setCurrentProject(project)
                      setIsSidebarOpen(false)
                    }}
                  >
                    {project.title}
                  </Button>
                ))}
                <Dialog open={isAddProjectDialogOpen} onOpenChange={setIsAddProjectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="mt-4">
                      <Plus className="mr-2 h-4 w-4" /> Add Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Project</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Enter project name"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, addProject)}
                      />
                      <Button onClick={addProject}>Add</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </nav>
            </SheetContent>
          </Sheet>
          <h1 className="text-xl font-bold ml-4">SAILY</h1>
        </div>
        <Button variant="secondary" size="sm">
          <Share2 className="mr-2 h-4 w-4" /> Share
        </Button>
      </nav>

      <main className="flex-grow overflow-x-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {editingId === 'project-title' ? (
              <Input
                ref={editInputRef}
                defaultValue={currentProject.title}
                onKeyDown={handleEdit}
                onBlur={() => setEditingId(null)}
                className="text-2xl font-bold"
              />
            ) : (
              <h2 className="text-2xl font-bold">{currentProject.title}</h2>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startEditing('project-title')}
              className="ml-2"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          
          </div>
          <Dialog open={isAddColumnDialogOpen} onOpenChange={setIsAddColumnDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add Column
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Column</DialogTitle>
              </DialogHeader>
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Enter column name"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, addColumn)}
                />
                <Button onClick={addColumn}>Add</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="all-columns" direction="horizontal" type="column">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex gap-4"
              >
                {currentProject.columns.map((column, index) => (
                  <Draggable key={column.id} draggableId={column.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="bg-secondary p-4 rounded-lg w-80"
                      >
                        <div className="flex items-center justify-between mb-4" {...provided.dragHandleProps}>
                          {editingId === column.id ? (
                            <Input
                              ref={editInputRef}
                              defaultValue={column.title}
                              onKeyDown={handleEdit}
                              onBlur={() => setEditingId(null)}
                            />
                          ) : (
                            <h3 className="text-lg font-semibold cursor-pointer" onClick={() => startEditing(column.id)}>
                              {column.title}
                            </h3>
                          )}
                          <Dialog open={isAddTaskDialogOpen === column.id} onOpenChange={(open) => setIsAddTaskDialogOpen(open ? column.id : null)}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add New Task</DialogTitle>
                              </DialogHeader>
                              <div className="flex items-center space-x-2">
                                <Input
                                  placeholder="Enter task name"
                                  value={newTaskName}
                                  onChange={(e) => setNewTaskName(e.target.value)}
                                  onKeyPress={(e) => handleKeyPress(e, () => addTask(column.id))}
                                />
                                <Button onClick={() => addTask(column.id)}>Add</Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <Droppable droppableId={column.id} type="task">
                          {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                              {column.taskIds.map((taskId, index) => {
                                const task = currentProject.tasks[taskId]
                                return (
                                  <Draggable key={task.id} draggableId={task.id} index={index}>
                                    {(provided) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className="bg-background p-3 rounded shadow"
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          {editingId === task.id ? (
                                            <Input
                                              ref={editInputRef}
                                              defaultValue={task.content}
                                              onKeyDown={handleEdit}
                                              onBlur={() => setEditingId(null)}
                                            />
                                          ) : (
                                            <span className="cursor-pointer" onClick={() => startEditing(task.id)}>
                                              {task.content}
                                            </span>
                                          )}
                                          <Dialog open={isAddSubtaskDialogOpen === task.id} onOpenChange={(open) => setIsAddSubtaskDialogOpen(open ? task.id : null)}>
                                            <DialogTrigger asChild>
                                              <Button variant="ghost" size="sm">
                                                <MoreVertical className="h-4 w-4" />
                                              </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                              <DialogHeader>
                                                <DialogTitle>Add Subtask</DialogTitle>
                                              </DialogHeader>
                                              <div className="flex items-center space-x-2">
                                                <Input
                                                  placeholder="Enter subtask name"
                                                  value={newSubtaskName}
                                                  onChange={(e) => setNewSubtaskName(e.target.value)}
                                                  onKeyPress={(e) => handleKeyPress(e, () => addChecklistItem(task.id))}
                                                />
                                                <Button onClick={() => addChecklistItem(task.id)}>Add</Button>
                                              </div>
                                            </DialogContent>
                                          </Dialog>
                                        </div>
                                        {task.checklist.length > 0 && (
                                          <div className="space-y-1 mt-2">
                                            {task.checklist.map(item => (
                                              <div key={item.id} className="flex items-center">
                                                <Checkbox
                                                  id={item.id}
                                                  checked={item.checked}
                                                  onCheckedChange={() => toggleChecklistItem(task.id, item.id)}
                                                />
                                                {editingId === `${task.id}|${item.id}` ? (
                                                  <Input
                                                    ref={editInputRef}
                                                    defaultValue={item.text}
                                                    onKeyDown={handleEdit}
                                                    onBlur={() => setEditingId(null)}
                                                    className="ml-2 text-sm"
                                                  />
                                                ) : (
                                                  <label
                                                    htmlFor={item.id}
                                                    className="ml-2 text-sm cursor-pointer"
                                                    onClick={() => startEditing(`${task.id}|${item.id}`)}
                                                  >
                                                    {item.text}
                                                  </label>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </Draggable>
                                )
                              })}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </main>
    </div>
  )
}