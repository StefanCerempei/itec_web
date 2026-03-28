import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import EditorNavbar from '../components/EditorNavbar'
import CodeEditor from '../components/CodeEditor'
import CollaborativeTerminal from '../components/CollaborativeTerminal'
import AISidebar from '../components/AISidebar'
import FileExplorer from '../components/FileExplorer'
import './Editor.css'

const Editor = () => {
    const { projectId } = useParams()
    const navigate = useNavigate()
    const [activeFile, setActiveFile] = useState('index.js')
    const [files, setFiles] = useState([
        { name: 'index.js', content: '// Welcome to iTECify!\nconsole.log("Hello, World!");', language: 'javascript' },
        { name: 'style.css', content: 'body {\n  margin: 0;\n  padding: 0;\n  font-family: sans-serif;\n}', language: 'css' },
        { name: 'index.html', content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>iTECify Project</title>\n</head>\n<body>\n  <h1>Hello from iTECify!</h1>\n</body>\n</html>', language: 'html' }
    ])
    const [code, setCode] = useState(files.find(f => f.name === activeFile)?.content || '')
    const [terminalOutput, setTerminalOutput] = useState([])
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [isTerminalOpen, setIsTerminalOpen] = useState(true)
    const [activeUsers, setActiveUsers] = useState([
        { id: 1, name: 'You', color: '#667eea', cursor: { line: 5, column: 10 } },
        { id: 2, name: 'Alex', color: '#f093fb', cursor: { line: 8, column: 15 } },
        { id: 3, name: 'AI Assistant', color: '#43e97b', cursor: { line: 12, column: 5 } }
    ])
    const [aiSuggestions, setAiSuggestions] = useState([])
    const [isExecuting, setIsExecuting] = useState(false)

    useEffect(() => {
        // Load project data
        console.log(`Loading project: ${projectId}`)

        // Simulate loading saved code
        const savedCode = localStorage.getItem(`project_${projectId}`)
        if (savedCode) {
            setCode(savedCode)
        }
    }, [projectId])

    useEffect(() => {
        // Save code to localStorage
        localStorage.setItem(`project_${projectId}`, code)

        // Update file content
        setFiles(prevFiles =>
            prevFiles.map(file =>
                file.name === activeFile
                    ? { ...file, content: code }
                    : file
            )
        )
    }, [code, projectId, activeFile])

    const handleFileChange = (fileName) => {
        setActiveFile(fileName)
        const fileContent = files.find(f => f.name === fileName)?.content || ''
        setCode(fileContent)
    }

    const handleRunCode = async () => {
        setIsExecuting(true)
        addTerminalOutput('> Running code...', 'info')

        // Simulate code execution
        setTimeout(() => {
            try {
                // Simple JavaScript execution simulation
                if (activeFile === 'index.js') {
                    const output = eval(code)
                    addTerminalOutput(output !== undefined ? output : 'Code executed successfully!', 'success')
                } else {
                    addTerminalOutput('File is not executable. Please run a JavaScript file.', 'error')
                }
            } catch (error) {
                addTerminalOutput(`Error: ${error.message}`, 'error')
            }
            setIsExecuting(false)
        }, 1000)
    }

    const addTerminalOutput = (message, type = 'info') => {
        setTerminalOutput(prev => [...prev, {
            id: Date.now(),
            message,
            type,
            timestamp: new Date().toLocaleTimeString()
        }])
    }

    const handleAISuggest = async () => {
        addTerminalOutput('🤖 AI is generating suggestions...', 'info')

        // Simulate AI suggestions
        setTimeout(() => {
            const suggestions = [
                {
                    id: 1,
                    title: 'Add error handling',
                    description: 'Wrap your code in try-catch blocks',
                    code: 'try {\n  // Your code here\n} catch (error) {\n  console.error(error);\n}',
                    accepted: false
                },
                {
                    id: 2,
                    title: 'Use async/await',
                    description: 'Modern asynchronous patterns',
                    code: 'async function main() {\n  const result = await fetchData();\n  console.log(result);\n}',
                    accepted: false
                },
                {
                    id: 3,
                    title: 'Add comments',
                    description: 'Document your code for better maintainability',
                    code: '// This function does something awesome\nfunction awesome() {\n  // Implementation\n}',
                    accepted: false
                }
            ]
            setAiSuggestions(suggestions)
            addTerminalOutput('✨ AI suggestions ready! Check the sidebar.', 'success')
        }, 1500)
    }

    const handleAcceptSuggestion = (suggestionId) => {
        const suggestion = aiSuggestions.find(s => s.id === suggestionId)
        if (suggestion) {
            setCode(prev => prev + '\n\n' + suggestion.code)
            setAiSuggestions(prev =>
                prev.map(s =>
                    s.id === suggestionId ? { ...s, accepted: true } : s
                )
            )
            addTerminalOutput(`✅ Accepted suggestion: ${suggestion.title}`, 'success')
        }
    }

    const handleRejectSuggestion = (suggestionId) => {
        setAiSuggestions(prev => prev.filter(s => s.id !== suggestionId))
        addTerminalOutput(`❌ Rejected suggestion`, 'info')
    }

    return (
        <div className="editor-container">
            <EditorNavbar
                projectName={projectId}
                onRun={handleRunCode}
                isExecuting={isExecuting}
                onAISuggest={handleAISuggest}
            />

            <div className="editor-main">
                {/* File Explorer */}
                <FileExplorer
                    files={files}
                    activeFile={activeFile}
                    onFileSelect={handleFileChange}
                    isOpen={isSidebarOpen}
                />

                {/* Code Editor */}
                <div className="editor-content">
                    <div className="editor-header">
                        <div className="file-tabs">
                            {files.map(file => (
                                <button
                                    key={file.name}
                                    className={`file-tab ${activeFile === file.name ? 'active' : ''}`}
                                    onClick={() => handleFileChange(file.name)}
                                >
                                    {file.name}
                                </button>
                            ))}
                        </div>
                        <button
                            className="toggle-sidebar-btn"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            {isSidebarOpen ? '◀' : '▶'}
                        </button>
                    </div>

                    <CodeEditor
                        code={code}
                        onChange={setCode}
                        language={files.find(f => f.name === activeFile)?.language || 'javascript'}
                        activeUsers={activeUsers}
                    />

                    {/* Collaborative Terminal */}
                    {isTerminalOpen && (
                        <CollaborativeTerminal
                            output={terminalOutput}
                            onClose={() => setIsTerminalOpen(false)}
                            onClear={() => setTerminalOutput([])}
                        />
                    )}

                    {!isTerminalOpen && (
                        <button
                            className="open-terminal-btn"
                            onClick={() => setIsTerminalOpen(true)}
                        >
                            Terminal ▼
                        </button>
                    )}
                </div>

                {/* AI Sidebar */}
                <AISidebar
                    suggestions={aiSuggestions}
                    onAccept={handleAcceptSuggestion}
                    onReject={handleRejectSuggestion}
                    isOpen={isSidebarOpen}
                />
            </div>
        </div>
    )
}

export default Editor