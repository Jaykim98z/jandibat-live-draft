// client/src/types/index.ts (업데이트된 버전)

// 사용자 정보
export interface User {
  userId: string;
  soopId: string;
  nickname: string;
  profileImage: string;
  position: 'ST' | 'WF' | 'CM' | 'CDM' | 'FB' | 'CB' | 'GK'; // 포지션 필수
  isHost?: boolean;
  isReady?: boolean;
  isManager?: boolean;
  joinedAt?: string;
}

// 방 설정
export interface RoomSettings {
  password?: string | null;
  draftType: 'shuffle' | 'snake' | 'manual';
  maxParticipants: number; // 100으로 고정
}

// 방 정보
export interface Room {
  id: string;
  code: string;
  title: string;
  host: User;
  settings: RoomSettings;
  status: 'waiting' | 'drafting' | 'completed' | 'abandoned';
  participants: User[];
  playerPool: Player[];
  managers: User[];
  participantCount: number;
  playerCount?: number;
  createdAt: string;
  updatedAt?: string;
}

// 선수 정보
export interface Player {
  soopId: string;
  nickname: string;
  profileImage: string;
  position: 'ST' | 'WF' | 'CM' | 'CDM' | 'FB' | 'CB' | 'GK';
  addedBy: string;
  isSelected: boolean;
  selectedBy?: string | null;
  selectedAt?: string | null;
}

// SOOP 프로필
export interface SoopProfile {
  soopId: string;
  nickname: string;
  profileImage: string;
  isLive?: boolean;  // 선택적 속성으로 추가
  stationUrl?: string;
  lastUpdated?: string;
  error?: string;
}

// API 응답 타입들
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  error?: string;
}

export interface RoomCreateResponse extends ApiResponse<Room> {
  room: Room;
  userInfo: {
    userId: string;
    isHost: boolean;
  };
}

export interface RoomJoinResponse extends ApiResponse<Room> {
  room: Room;
  userInfo: {
    userId: string;
    isHost: boolean;
  };
}

export interface SoopProfileResponse extends ApiResponse<SoopProfile> {
  profile: SoopProfile;
}

export interface SoopValidationResponse extends ApiResponse<SoopProfile> {
  soopId: string;
  isValid: boolean;
  profile: SoopProfile | null;
}

export interface SoopMultipleResponse extends ApiResponse<SoopProfile[]> {
  count: number;
  profiles: SoopProfile[];
  stats: {
    requested: number;
    successful: number;
    failed: number;
  };
}

// 폼 데이터 타입들
export interface CreateRoomForm {
  title: string;
  hostSoopId: string;
  hostPosition: 'ST' | 'WF' | 'CM' | 'CDM' | 'FB' | 'CB' | 'GK';
  password?: string;
  draftType: 'shuffle' | 'snake' | 'manual';
}

export interface JoinRoomForm {
  roomCode: string;
  soopId: string;
  position: 'ST' | 'WF' | 'CM' | 'CDM' | 'FB' | 'CB' | 'GK';
  password?: string;
}

export interface AddPlayerForm {
  soopId: string;
  position: 'ST' | 'WF' | 'CM' | 'CDM' | 'FB' | 'CB' | 'GK';
}

// Socket.io 이벤트 타입들
export interface ClientToServerEvents {
  'join-room': (data: { roomCode: string; userData: User }) => void;
  'leave-room': (data: { roomCode: string; userId: string }) => void;
  'send-chat-message': (data: { roomCode: string; message: string; userId: string }) => void;
  'ready-toggle': (data: { roomCode: string; userId: string }) => void;
  'update-room-settings': (data: { roomCode: string; settings: any; userId: string }) => void;
}

export interface ServerToClientEvents {
  'room-updated': (room: Room) => void;
  'participant-joined': (participant: User) => void;
  'participant-left': (userId: string) => void;
  'chat-message': (data: { userId: string; nickname: string; message: string; timestamp: string }) => void;
  'error': (error: { message: string; code?: string }) => void;
  'connected': (data: { message: string; socketId: string; timestamp: string }) => void;
  'room-joined': (data: { room: Room; userInfo: { userId: string; isHost: boolean } }) => void;
}

// 컴포넌트 Props 타입들
export interface RoomCardProps {
  room: Room;
  onJoin?: () => void;
}

export interface PlayerCardProps {
  player: Player;
  isSelected?: boolean;
  isSelectable?: boolean;
  onSelect?: () => void;
}

export interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
}

// 앱 상태 타입
export interface AppState {
  user: User | null;
  currentRoom: Room | null;
  isConnected: boolean;
  loading: boolean;
  error: string | null;
}