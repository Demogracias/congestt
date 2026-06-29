Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")
ScriptDir = FSO.GetParentFolderName(WScript.ScriptFullName)
BackendDir = FSO.BuildPath(ScriptDir, "backend")
WshShell.CurrentDirectory = BackendDir
WshShell.Run "node dist/index.js", 0, False
WScript.Sleep 2000
WshShell.Run "http://localhost:3001"
