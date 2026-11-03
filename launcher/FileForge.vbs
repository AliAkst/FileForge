' FileForge launcher — starts the local app server and opens it in an app window.
' Run this file directly (or through the desktop shortcut) to start FileForge.

Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
rootDir = fso.GetParentFolderName(scriptDir)
launchScript = rootDir & "\frontend\scripts\launch.mjs"

If Not fso.FileExists(launchScript) Then
  MsgBox "FileForge dosyaları bulunamadı." & vbCrLf & launchScript, vbExclamation, "FileForge"
  WScript.Quit 1
End If

nodeExe = shell.ExpandEnvironmentStrings("%ProgramFiles%") & "\nodejs\node.exe"
If Not fso.FileExists(nodeExe) Then
  nodeExe = shell.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\nodejs\node.exe"
End If
If Not fso.FileExists(nodeExe) Then
  nodeExe = "node.exe"
End If

command = """" & nodeExe & """ """ & launchScript & """"
shell.Run command, 0, False
