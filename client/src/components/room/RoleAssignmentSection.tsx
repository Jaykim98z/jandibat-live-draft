// client/src/components/room/RoleAssignmentSection.tsx
import React, { useState } from 'react';
import { Participant, Role, UserInfo } from '../../types';
import Button from '../common/Button';
import styles from './RoleAssignmentSection.module.css';

interface RoleAssignmentSectionProps {
  participants: Participant[];
  userInfo: UserInfo | null;
  managerCount: number;
  playerCount: number;
  canStartDraft: boolean;
  onAssignRole: (userId: string, role: Role) => void;
  onAutoAssignRoles: () => void;
  onStartDraft: () => void;
  isLoading?: boolean;
}

const RoleAssignmentSection: React.FC<RoleAssignmentSectionProps> = ({
  participants,
  userInfo,
  managerCount,
  playerCount,
  canStartDraft,
  onAssignRole,
  onAutoAssignRoles,
  onStartDraft,
  isLoading = false
}) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // 방장 여부 확인
  const isHost = userInfo?.isHost || false;

  // 역할 변경 핸들러
  const handleRoleChange = (userId: string, newRole: Role) => {
    onAssignRole(userId, newRole);
  };

  // 카드 토글 핸들러
  const toggleCard = (userId: string) => {
    setExpandedCard(expandedCard === userId ? null : userId);
  };

  // 역할별 아이콘 및 색상
  const getRoleDisplay = (role: Role) => {
    switch (role) {
      case 'manager':
        return {
          icon: 'fas fa-user-tie',
          label: '감독',
          color: 'var(--primary-600)',
          bgColor: 'var(--primary-50)',
          borderColor: 'var(--primary-200)'
        };
      case 'player':
        return {
          icon: 'fas fa-running',
          label: '선수',
          color: 'var(--secondary-600)',
          bgColor: 'var(--secondary-50)',
          borderColor: 'var(--secondary-200)'
        };
    }
  };

  return (
    <div className={styles.roleAssignmentSection}>
      {/* 헤더 */}
      <div className={styles.sectionHeader}>
        <h3>
          <i className="fas fa-users-cog mr-2"></i>
          역할 배정
        </h3>
        {isHost && (
          <div className={styles.headerActions}>
            <Button
              variant="outline"
              size="sm"
              onClick={onAutoAssignRoles}
              disabled={isLoading}
            >
              <i className="fas fa-magic mr-1"></i>
              자동 배정
            </Button>
          </div>
        )}
      </div>

      {/* 현재 상태 표시 */}
      <div className={styles.statusCard}>
        <div className={styles.statusGrid}>
          <div className={styles.statusItem}>
            <div className={styles.statusNumber} style={{ color: 'var(--primary-600)' }}>
              {managerCount}
            </div>
            <div className={styles.statusLabel}>감독</div>
            <div className={styles.statusRequirement}>
              {managerCount >= 2 ? (
                <i className="fas fa-check text-green-500"></i>
              ) : (
                <span className="text-red-500">최소 2명</span>
              )}
            </div>
          </div>
          
          <div className={styles.statusItem}>
            <div className={styles.statusNumber} style={{ color: 'var(--secondary-600)' }}>
              {playerCount}
            </div>
            <div className={styles.statusLabel}>선수</div>
            <div className={styles.statusRequirement}>
              {playerCount >= 1 ? (
                <i className="fas fa-check text-green-500"></i>
              ) : (
                <span className="text-red-500">최소 1명</span>
              )}
            </div>
          </div>

          <div className={styles.statusItem}>
            <div className={styles.statusNumber}>
              {participants.filter(p => p.isReady).length}/{participants.length}
            </div>
            <div className={styles.statusLabel}>준비완료</div>
            <div className={styles.statusRequirement}>
              {participants.every(p => p.isReady) ? (
                <i className="fas fa-check text-green-500"></i>
              ) : (
                <span className="text-red-500">모두 필요</span>
              )}
            </div>
          </div>
        </div>

        {/* 드래프트 시작 버튼 */}
        {isHost && (
          <div className={styles.startDraftSection}>
            <Button
              variant={canStartDraft ? "primary" : "outline"}
              size="lg"
              onClick={onStartDraft}
              disabled={!canStartDraft || isLoading}
              className={styles.startDraftButton}
            >
              <i className="fas fa-play mr-2"></i>
              {canStartDraft ? '드래프트 시작!' : '조건을 충족해주세요'}
            </Button>
            
            {!canStartDraft && (
              <div className={styles.requirementsList}>
                <p>드래프트 시작 조건:</p>
                <ul>
                  {managerCount < 2 && <li>감독 2명 이상 필요</li>}
                  {playerCount < 1 && <li>선수 1명 이상 필요</li>}
                  {!participants.every(p => p.isReady) && <li>모든 참가자 준비 완료 필요</li>}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 참가자 목록 */}
      <div className={styles.participantsList}>
        {participants.map((participant) => {
          const roleDisplay = getRoleDisplay(participant.role);
          const isExpanded = expandedCard === participant.userId;
          
          return (
            <div 
              key={participant.userId}
              className={`${styles.participantCard} ${participant.userId === userInfo?.userId ? styles.currentUser : ''}`}
              style={{
                borderColor: roleDisplay.borderColor,
                backgroundColor: roleDisplay.bgColor
              }}
            >
              {/* 기본 정보 */}
              <div className={styles.participantHeader} onClick={() => toggleCard(participant.userId)}>
                <div className={styles.participantAvatar}>
                  <img 
                    src={participant.profileImage || '/default-avatar.png'}
                    alt={participant.nickname}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/default-avatar.png';
                    }}
                  />
                  {participant.isHost && (
                    <div className={styles.hostBadge}>
                      <i className="fas fa-crown"></i>
                    </div>
                  )}
                </div>
                
                <div className={styles.participantInfo}>
                  <div className={styles.participantName}>
                    {participant.nickname}
                    {participant.userId === userInfo?.userId && (
                      <span className={styles.youBadge}>(나)</span>
                    )}
                  </div>
                  <div className={styles.participantDetails}>
                    @{participant.soopId}
                    <span className={styles.positionBadge}>{participant.position}</span>
                  </div>
                </div>

                <div className={styles.roleDisplay}>
                  <div className={styles.roleIcon} style={{ color: roleDisplay.color }}>
                    <i className={roleDisplay.icon}></i>
                  </div>
                  <div className={styles.roleLabel} style={{ color: roleDisplay.color }}>
                    {roleDisplay.label}
                  </div>
                </div>

                {isHost && (
                  <div className={styles.expandIcon}>
                    <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                  </div>
                )}
              </div>

              {/* 역할 변경 컨트롤 (방장만, 확장 시) */}
              {isHost && isExpanded && (
                <div className={styles.roleControls}>
                  <div className={styles.roleOptions}>
                    <button
                      className={`${styles.roleButton} ${participant.role === 'manager' ? styles.active : ''}`}
                      onClick={() => handleRoleChange(participant.userId, 'manager')}
                      disabled={isLoading}
                    >
                      <i className="fas fa-user-tie mr-2"></i>
                      감독으로 지정
                    </button>
                    
                    <button
                      className={`${styles.roleButton} ${participant.role === 'player' ? styles.active : ''}`}
                      onClick={() => handleRoleChange(participant.userId, 'player')}
                      disabled={isLoading}
                    >
                      <i className="fas fa-running mr-2"></i>
                      선수로 지정
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 안내 메시지 */}
      {!isHost && (
        <div className={styles.infoMessage}>
          <i className="fas fa-info-circle mr-2"></i>
          방장이 역할을 배정하고 있습니다. 잠시만 기다려주세요.
        </div>
      )}
    </div>
  );
};

export default RoleAssignmentSection;