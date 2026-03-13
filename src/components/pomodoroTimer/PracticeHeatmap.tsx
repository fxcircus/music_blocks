import React, { useMemo } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

interface PracticeEntry {
  date: string; // YYYY-MM-DD
  count: number;
}

interface PracticeHeatmapProps {
  data: PracticeEntry[];
}

const WEEKS = 16;
const DAYS_PER_WEEK = 7;
const CELL_SIZE = 12;
const CELL_GAP = 3;
const DAY_LABELS = ['M', '', 'W', '', 'F', '', 'S'];
const DAY_LABEL_WIDTH = 16;

const STREAK_TIERS = [
  { min: 90, icon: '\uD83D\uDC51', label: 'Legendary' },
  { min: 60, icon: '\uD83C\uDFC6', label: 'Dedicated' },
  { min: 30, icon: '\uD83C\uDFB8', label: 'Serious player' },
  { min: 14, icon: '\uD83D\uDCAB', label: 'Locked in' },
  { min: 7, icon: '\uD83D\uDD25', label: 'On a streak' },
  { min: 3, icon: '\u2B50', label: 'Building momentum' },
  { min: 1, icon: '\uD83C\uDF31', label: 'Just getting started' },
];

const Wrapper = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  height: 100%;
`;

const StreakRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const StreakIcon = styled.span`
  font-size: 16px;
  line-height: 1;
`;

const StatsRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const StatValue = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-weight: 700;
`;

const GridContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  overflow-x: auto;
  max-width: 100%;
`;

const MonthLabels = styled.div`
  display: flex;
  margin-left: ${DAY_LABEL_WIDTH + 2}px;
  margin-bottom: 2px;
`;

const MonthLabel = styled.span<{ $width: number }>`
  width: ${({ $width }) => $width}px;
  font-size: 9px;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
`;

const GridBody = styled.div`
  display: flex;
`;

const DayLabelsColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${CELL_GAP}px;
  margin-right: 2px;
`;

const DayLabel = styled.span`
  height: ${CELL_SIZE}px;
  width: ${DAY_LABEL_WIDTH}px;
  font-size: 9px;
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 2px;
`;

const WeeksGrid = styled.div`
  display: flex;
  gap: ${CELL_GAP}px;
`;

const WeekColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${CELL_GAP}px;
`;

const Cell = styled.div<{ $level: number; $isToday: boolean }>`
  width: ${CELL_SIZE}px;
  height: ${CELL_SIZE}px;
  border-radius: 2px;
  background: ${({ theme, $level }) => {
    if ($level === 0) return `${theme.colors.border}40`;
    if ($level === 1) return `${theme.colors.primary}50`;
    if ($level === 2) return `${theme.colors.primary}90`;
    return theme.colors.primary;
  }};
  border: ${({ $isToday, theme }) =>
    $isToday ? `1.5px solid ${theme.colors.text}` : '1.5px solid transparent'};
  transition: background ${({ theme }) => theme.transitions.fast};
`;

function getDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getMonday(d: Date): Date {
  const result = new Date(d);
  const day = result.getDay();
  // getDay(): 0=Sun, 1=Mon ... 6=Sat → we want Monday as start
  const diff = day === 0 ? 6 : day - 1;
  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function PracticeHeatmap({ data }: PracticeHeatmapProps) {
  const { grid, todayStr, monthHeaders, streak, totalSessions } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = getDateString(today);

    // Build lookup map
    const countMap = new Map<string, number>();
    for (const entry of data) {
      countMap.set(entry.date, entry.count);
    }

    // Find the Monday of the current week
    const currentMonday = getMonday(today);

    // Go back (WEEKS - 1) weeks to get start
    const startMonday = new Date(currentMonday);
    startMonday.setDate(startMonday.getDate() - (WEEKS - 1) * 7);

    // Build grid: array of weeks, each week is array of 7 days
    const grid: { date: string; count: number }[][] = [];
    const cursor = new Date(startMonday);

    for (let w = 0; w < WEEKS; w++) {
      const week: { date: string; count: number }[] = [];
      for (let d = 0; d < DAYS_PER_WEEK; d++) {
        const dateStr = getDateString(cursor);
        const isFuture = cursor > today;
        week.push({
          date: dateStr,
          count: isFuture ? -1 : (countMap.get(dateStr) || 0),
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      grid.push(week);
    }

    // Month headers: track which months appear and at which week column
    const monthHeaders: { label: string; weekSpan: number }[] = [];
    let prevMonth = -1;
    for (let w = 0; w < WEEKS; w++) {
      // Use the Monday of each week to determine the month
      const mondayDate = new Date(startMonday);
      mondayDate.setDate(mondayDate.getDate() + w * 7);
      const month = mondayDate.getMonth();
      if (month !== prevMonth) {
        monthHeaders.push({ label: MONTH_NAMES[month], weekSpan: 1 });
        prevMonth = month;
      } else {
        monthHeaders[monthHeaders.length - 1].weekSpan++;
      }
    }

    // Calculate streak (consecutive days with count > 0, ending at today)
    let streak = 0;
    const checkDate = new Date(today);
    while (true) {
      const ds = getDateString(checkDate);
      const c = countMap.get(ds) || 0;
      if (c > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Total sessions
    let totalSessions = 0;
    for (const entry of data) {
      totalSessions += entry.count;
    }

    return { grid, todayStr, monthHeaders, streak, totalSessions };
  }, [data]);

  const streakTier = STREAK_TIERS.find(t => streak >= t.min);
  const cellStep = CELL_SIZE + CELL_GAP;

  return (
    <Wrapper
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
    >
      {streakTier && (
        <StreakRow>
          <StreakIcon>{streakTier.icon}</StreakIcon>
          <span>{streakTier.label}</span>
          <span style={{ opacity: 0.6 }}>({streak}d)</span>
        </StreakRow>
      )}

      <GridContainer>
        <MonthLabels>
          {monthHeaders.map((mh, i) => (
            <MonthLabel key={i} $width={mh.weekSpan * cellStep}>
              {mh.weekSpan >= 2 ? mh.label : ''}
            </MonthLabel>
          ))}
        </MonthLabels>
        <GridBody>
          <DayLabelsColumn>
            {DAY_LABELS.map((label, i) => (
              <DayLabel key={i}>{label}</DayLabel>
            ))}
          </DayLabelsColumn>
          <WeeksGrid>
            {grid.map((week, wi) => (
              <WeekColumn key={wi}>
                {week.map((day, di) => {
                  const level = day.count < 0 ? -1 : day.count === 0 ? 0 : day.count === 1 ? 1 : day.count === 2 ? 2 : 3;
                  if (level === -1) {
                    return <Cell key={di} $level={0} $isToday={false} style={{ opacity: 0.15 }} />;
                  }
                  return (
                    <Cell
                      key={di}
                      $level={level}
                      $isToday={day.date === todayStr}
                    />
                  );
                })}
              </WeekColumn>
            ))}
          </WeeksGrid>
        </GridBody>
      </GridContainer>

      <StatsRow>
        <span><StatValue>{totalSessions}</StatValue> total sessions</span>
      </StatsRow>
    </Wrapper>
  );
}
