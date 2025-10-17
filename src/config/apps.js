import {
  Settings as SettingsIcon,
  Globe,
  Terminal,
  Folder,
  Music,
  Video,
  Mic,
  FileText,
  Mail,
  MessageSquare,
  Calendar,
  StickyNote,
  CheckSquare,
  Calculator,
  FileType,
  Image,
  Camera,
  Podcast,
  Activity,
  HardDrive,
  Cloud,
  MapPin,
  MessageCircle,
  Users,
  Code,
  Database,
  Brush,
  Presentation,
  Clock,
  Newspaper,
  Blocks,
} from "lucide-react";

import { BrowserApp } from "../apps/BrowserApp.jsx";
import { TextApp } from "../apps/TextApp.jsx";
import { VoiceApp } from "../apps/VoiceApp.jsx";
import { FilesApp } from "../apps/FilesApp.jsx";
import { MusicApp } from "../apps/MusicApp.jsx";
import { VideoApp } from "../apps/VideoApp.jsx";
import { MessagesApp } from "../apps/MessagesApp.jsx";
import { EmailApp } from "../apps/EmailApp.jsx";
import { TerminalApp } from "../apps/TerminalApp.jsx";
import { SettingsApp } from "../apps/SettingsApp.jsx";
import { StubApp } from "../apps/StubApp.jsx";
import { CalendarApp } from "../apps/CalendarApp.jsx";
import { NotesApp } from "../apps/NotesApp.jsx";
import { TasksApp } from "../apps/TasksApp.jsx";
import { CalculatorApp } from "../apps/CalculatorApp.jsx";
import { PDFViewerApp } from "../apps/PDFViewerApp.jsx";
import { PhotosApp } from "../apps/PhotosApp.jsx";
import { CameraApp } from "../apps/CameraApp.jsx";
import { AudioRecorderApp } from "../apps/AudioRecorderApp.jsx";
import { PodcastApp } from "../apps/PodcastApp.jsx";
import { ActivityMonitorApp } from "../apps/ActivityMonitorApp.jsx";
import { DiskUtilityApp } from "../apps/DiskUtilityApp.jsx";
import { WeatherApp } from "../apps/WeatherApp.jsx";
import { MapsApp } from "../apps/MapsApp.jsx";
import { ChatApp } from "../apps/ChatApp.jsx";
import { VideoCallApp } from "../apps/VideoCallApp.jsx";
import { ContactsApp } from "../apps/ContactsApp.jsx";
import { CodeEditorApp } from "../apps/CodeEditorApp.jsx";
import { DatabaseApp } from "../apps/DatabaseApp.jsx";
import { DrawingApp } from "../apps/DrawingApp.jsx";
import { PresentationApp } from "../apps/PresentationApp.jsx";
import { ClockApp } from "../apps/ClockApp.jsx";
import { NewsApp } from "../apps/NewsApp.jsx";
import { TileConfiguratorApp } from "../apps/TileConfiguratorApp.jsx";
import { getManifest } from "./manifests.js";

export const APPS = [
  { id: "terminal", title: "Terminal", color: "bg-zinc-700", icon: Terminal, size: "col-span-1 row-span-1", content: TerminalApp, manifest: () => getManifest("terminal") },
  { id: "browser",  title: "Browser",  color: "bg-sky-600",  icon: Globe,    size: "col-span-2 row-span-1", content: BrowserApp, manifest: () => getManifest("browser") },
  { id: "settings", title: "Settings", color: "bg-neutral-700", icon: SettingsIcon, size: "col-span-1 row-span-1", content: SettingsApp, manifest: () => getManifest("settings") },
  { id: "text",     title: "Text",     color: "bg-amber-600", icon: FileText, size: "col-span-1 row-span-2", content: TextApp, manifest: () => getManifest("text") },
  { id: "voice",    title: "Voice",    color: "bg-rose-600",  icon: Mic,      size: "col-span-1 row-span-1", content: VoiceApp, manifest: () => getManifest("voice") },
  { id: "music",    title: "Music",    color: "bg-purple-600",icon: Music,    size: "col-span-2 row-span-1", content: MusicApp, manifest: () => getManifest("music") },
  { id: "video",    title: "Video",    color: "bg-teal-600",  icon: Video,    size: "col-span-1 row-span-1", content: VideoApp, manifest: () => getManifest("video") },
  { id: "files",    title: "Files",    color: "bg-indigo-600",icon: Folder,   size: "col-span-1 row-span-2", content: FilesApp, manifest: () => getManifest("files") },
  { id: "messages", title: "Messages", color: "bg-cyan-600",  icon: MessageSquare, size: "col-span-1 row-span-1", content: MessagesApp, manifest: () => getManifest("messages") },
  { id: "email",    title: "Email",    color: "bg-red-600",   icon: Mail,          size: "col-span-1 row-span-1", content: EmailApp, manifest: () => getManifest("email") },
  { id: "calendar", title: "Calendar", color: "bg-blue-600", icon: Calendar, size: "col-span-1 row-span-1", content: CalendarApp, manifest: () => getManifest("calendar") },
  { id: "notes",    title: "Notes",    color: "bg-yellow-600", icon: StickyNote, size: "col-span-1 row-span-1", content: NotesApp, manifest: () => getManifest("notes") },
  { id: "tasks",    title: "Tasks",    color: "bg-green-600", icon: CheckSquare, size: "col-span-1 row-span-1", content: TasksApp, manifest: () => getManifest("tasks") },
  { id: "calculator", title: "Calculator", color: "bg-gray-600", icon: Calculator, size: "col-span-1 row-span-1", content: CalculatorApp, manifest: () => getManifest("calculator") },
  { id: "pdf",      title: "PDF",      color: "bg-red-700", icon: FileType, size: "col-span-1 row-span-1", content: PDFViewerApp, manifest: () => getManifest("pdf") },
  { id: "photos",   title: "Photos",   color: "bg-pink-600", icon: Image, size: "col-span-2 row-span-1", content: PhotosApp, manifest: () => getManifest("photos") },
  { id: "camera",   title: "Camera",   color: "bg-slate-700", icon: Camera, size: "col-span-1 row-span-1", content: CameraApp, manifest: () => getManifest("camera") },
  { id: "recorder", title: "Recorder", color: "bg-orange-600", icon: Mic, size: "col-span-1 row-span-1", content: AudioRecorderApp, manifest: () => getManifest("recorder") },
  { id: "podcast",  title: "Podcast",  color: "bg-violet-600", icon: Podcast, size: "col-span-1 row-span-1", content: PodcastApp, manifest: () => getManifest("podcast") },
  { id: "activity", title: "Activity", color: "bg-emerald-600", icon: Activity, size: "col-span-1 row-span-1", content: ActivityMonitorApp, manifest: () => getManifest("activity") },
  { id: "disk",     title: "Disk",     color: "bg-stone-700", icon: HardDrive, size: "col-span-1 row-span-1", content: DiskUtilityApp, manifest: () => getManifest("disk") },
  { id: "weather",  title: "Weather",  color: "bg-sky-500", icon: Cloud, size: "col-span-1 row-span-1", content: WeatherApp, manifest: () => getManifest("weather") },
  { id: "maps",     title: "Maps",     color: "bg-lime-600", icon: MapPin, size: "col-span-2 row-span-1", content: MapsApp, manifest: () => getManifest("maps") },
  { id: "chat",     title: "Chat",     color: "bg-indigo-500", icon: MessageCircle, size: "col-span-1 row-span-1", content: ChatApp, manifest: () => getManifest("chat") },
  { id: "videocall", title: "Video Call", color: "bg-purple-700", icon: Video, size: "col-span-1 row-span-1", content: VideoCallApp, manifest: () => getManifest("videocall") },
  { id: "contacts", title: "Contacts", color: "bg-fuchsia-600", icon: Users, size: "col-span-1 row-span-1", content: ContactsApp, manifest: () => getManifest("contacts") },
  { id: "code",     title: "Code",     color: "bg-zinc-800", icon: Code, size: "col-span-2 row-span-2", content: CodeEditorApp, manifest: () => getManifest("code") },
  { id: "database", title: "Database", color: "bg-cyan-700", icon: Database, size: "col-span-1 row-span-1", content: DatabaseApp, manifest: () => getManifest("database") },
  { id: "drawing",  title: "Drawing",  color: "bg-rose-500", icon: Brush, size: "col-span-1 row-span-1", content: DrawingApp, manifest: () => getManifest("drawing") },
  { id: "presentation", title: "Slides", color: "bg-amber-500", icon: Presentation, size: "col-span-1 row-span-1", content: PresentationApp, manifest: () => getManifest("presentation") },
  { id: "clock",    title: "Clock",    color: "bg-neutral-600", icon: Clock, size: "col-span-1 row-span-1", content: ClockApp, manifest: () => getManifest("clock") },
  { id: "news",     title: "News",     color: "bg-cyan-600", icon: Newspaper, size: "col-span-2 row-span-1", content: NewsApp, manifest: () => getManifest("news") },
  { id: "tileconfig", title: "Tile Config", color: "bg-gradient-to-br from-indigo-600 to-purple-600", icon: Blocks, size: "col-span-2 row-span-2", content: TileConfiguratorApp, manifest: () => getManifest("tileconfig") },
];
