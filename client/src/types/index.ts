// client/src/types/index.ts (역할 시스템 타입 추가)

export type Position = 'ST' | 'WF' | 'CM' | 'CDM' | 'FB' | 'CB' | 'GK';
export type Role = 'manager' | 'player';
export type RoomStatus = 'waiting' | 'role-assignment' | 'drafting' | 'completed' | 'abandoned';
export type DraftType = 'shuffle' | 'snake' | 'manual';

export interface User {
  soopId: string;
  nickname: string;
  profileImage: string;
  position: Position;
}

export interface Participant extends User {
  userId: string;
  role: Role; // 새로 추가
  joinedAt: string;
  isHost: boolean;
  isReady: boolean;
}

export interface Manager {
  userId: string;
  soopId: string;
  nickname: string;
  profileImage: string;
  position: Position;
  assignedAt: string;
  team: Player[];
}

export interface Player {
  userId?: string; // 참가자인 경우
  soopId: string;
  nickname: string;
  profileImage: string;
  position: Position;
  addedBy?: string;
  isSelected: boolean;
  selectedBy?: string;
  selectedAt?: string;
  pickOrder?: number;
  round?: number;
  pickedAt?: string;
}

export interface RoomSettings {
  password?: string;
  draftType: DraftType;
  maxParticipants: number;
}

export interface Room {
  id: string;
  code: string;
  title: string;
  host: {
    userId: string;
    soopId: string;
    nickname: string;
    profileImage: string;
    position: Position;
  };
  settings: RoomSettings;
  status: RoomStatus;
  participants: Participant[];
  participantCount: number;
  managers: Manager[];
  playerPool: Player[];
  managerCount: number; // 새로 추가
  playerCount: number;  // 새로 추가
  canStartDraft: boolean; // 새로 추가
  currentTurn?: string;
  currentRound: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserInfo {
  userId: string;
  isHost: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  nickname: string;
  message: string;
  timestamp: string;
  type: 'user' | 'system' | 'notification';
}

// 역할 배정 관련 새로운 타입들
export interface RoleAssignmentData {
  userId: string;
  role: Role;
}

export interface RoleStats {
  totalParticipants: number;
  managerCount: number;
  playerCount: number;
  allReady: boolean;
  canStartDraft: boolean;
  requirements: {
    minManagers: number;
    minPlayers: number;
    needsAllReady: boolean;
  };
}

// Socket 이벤트 타입들
export interface SocketEvents {
  // 기존 이벤트들
  'join-room': { roomCode: string; userData: User };
  'leave-room': { roomCode: string; userId: string };
  'send-chat-message': { roomCode: string; message: string; userId: string };
  'ready-toggle': { roomCode: string; userId: string };
  'update-room-settings': { roomCode: string; settings: any; userId: string };
  
  // 새로운 역할 배정 이벤트들
  'assign-role': { roomCode: string; userId: string; role: Role };
  'auto-assign-roles': { roomCode: string };
  'start-draft': { roomCode: string };
}

export interface SocketResponses {
  // 기존 응답들
  'room-updated': { room: Room; message?: string };
  'participant-joined': { room: Room; participant: Participant };
  'participant-left': { room: Room; participantId: string };
  'chat-message': ChatMessage;
  'error': { message: string };
  
  // 새로운 역할 배정 응답들
  'role-assigned': { room: Room; assignedUser: RoleAssignmentData; message: string };
  'roles-auto-assigned': { room: Room; message: string };
  'draft-started': { room: Room; message: string };
}