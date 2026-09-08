// Jediné miesto, kde sa importujú ikony z lucide-react — explicitný zoznam drží
// tree-shaking (celý balík by bol ~1 MB). Katalóg (src/config/catalog.js) používa
// názvy ako reťazce, tu sa prekladajú na komponenty. Nikdy emoji (DESIGN.md §3).
import {
  AlertCircle, AlertTriangle, AppWindow, ArrowLeftRight, Bed, Bell, BookOpen, BrickWall, Bug,
  Building2, Bus, Calendar, Camera, CarFront, Check, CheckCircle2, ChevronLeft, ChevronRight,
  CircleHelp, ClipboardList, Clock, Copy, CreditCard, DoorOpen, Droplets, ExternalLink, FileCheck,
  FileText, Flame, Globe, Grid2x2, HeartPulse, Home, ImagePlus, Inbox, Info, KeyRound, Languages,
  LifeBuoy, Loader2, LogOut, Mail, MapPin, Megaphone, MessageCircle, MessageSquare, Moon, Phone,
  Refrigerator, Send, Shirt, ShieldCheck, Siren, Smartphone, Sparkles, Star, Trash2, User, Users,
  Utensils, Volume2, WashingMachine, Wifi, WifiOff, Wrench, X, Zap, Cigarette, Landmark, Banknote,
  GraduationCap, Headset, Hourglass, Timer, Ban, ParkingCircle, ShoppingBag, Sun, TramFront, EyeOff, Church,
} from 'lucide-react';

export const ICONS = {
  AlertCircle, AlertTriangle, AppWindow, ArrowLeftRight, Bed, Bell, BookOpen, BrickWall, Bug,
  Building2, Bus, Calendar, Camera, CarFront, Check, CheckCircle2, ChevronLeft, ChevronRight,
  CircleHelp, ClipboardList, Clock, Copy, CreditCard, DoorOpen, Droplets, ExternalLink, FileCheck,
  FileText, Flame, Globe, Grid2x2, HeartPulse, Home, ImagePlus, Inbox, Info, KeyRound, Languages,
  LifeBuoy, Loader2, LogOut, Mail, MapPin, Megaphone, MessageCircle, MessageSquare, Moon, Phone,
  Refrigerator, Send, Shirt, ShieldCheck, Siren, Smartphone, Sparkles, Star, Trash2, User, Users,
  Utensils, Volume2, WashingMachine, Wifi, WifiOff, Wrench, X, Zap, Cigarette, Landmark, Banknote,
  GraduationCap, Headset, Hourglass, Timer, Ban, ParkingCircle, ShoppingBag, Sun, TramFront, EyeOff, Church,
};

export function Icon({ name, size = 18, ...rest }) {
  const Cmp = ICONS[name] || CircleHelp;
  return <Cmp size={size} {...rest}/>;
}
// Ikony sprievodcov (id → názov ikony) — mimo katalógu, lebo sprievodcovia žijú v content/.
export const GUIDE_ICONS = { arrival: 'ClipboardList', police: 'ShieldCheck', health: 'HeartPulse', money: 'Banknote', transport: 'Bus', help: 'GraduationCap' };
export const HOUSE_INFO_ICONS = { kitchen: 'Utensils', laundryRoom: 'WashingMachine', quiet: 'Moon', cleaning: 'Sparkles', waste: 'Trash2', smoking: 'Cigarette', visitors: 'Users', parking: 'CarFront', card: 'KeyRound' };
