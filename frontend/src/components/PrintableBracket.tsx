import React from 'react';
import styles from '../styles/PrintBracket.module.css';
import { NodeType, Regions, FinalFourState } from '../utils/Types';

interface PrintableRegionProps {
  region: NodeType[];
  regionName: string;
  nameTable: Record<string, string>;
  gameWinners: Record<string, string>;
}

const PrintableRegion: React.FC<PrintableRegionProps> = ({ region, regionName, nameTable, gameWinners }) => {
  // Get nodes at a specific level
  const getNodesAtLevel = (node: NodeType | null, targetLevel: number, currentLevel: number): NodeType[] => {
    if (!node) return [];
    if (currentLevel === targetLevel) return [node];
    
    const leftNodes = node.left ? getNodesAtLevel(node.left, targetLevel, currentLevel - 1) : [];
    const rightNodes = node.right ? getNodesAtLevel(node.right, targetLevel, currentLevel - 1) : [];
    return [...leftNodes, ...rightNodes];
  };

  // Find the maximum depth of the tree
  const findMaxDepth = (node: NodeType | null): number => {
    if (!node) return 0;
    return Math.max(1 + findMaxDepth(node.left), 1 + findMaxDepth(node.right));
  };

  const maxDepth = findMaxDepth(region[0]);
  // Skip the First Four level by starting at index 1
  const levels = Array.from({ length: maxDepth - 1 }, (_, i) => i + 1);

  // Get the display text for a node
  const getDisplayText = (node: NodeType): string => {
    if (!node) return '';

    // For regular teams or First Four winners
    if (node.name && node.seed) {
      // If this node has a game (First Four), show the winner if available
      if (node.gameUUID && gameWinners[node.gameUUID]) {
        const winner = gameWinners[node.gameUUID];
        const winnerNode = node.left?.name === winner ? node.left : node.right;
        if (winnerNode?.seed && winnerNode?.name) {
          return `${winnerNode.seed}. ${nameTable[winnerNode.name] || winnerNode.name}`;
        }
      }
      // Otherwise show the team
      return `${node.seed}. ${nameTable[node.name] || node.name}`;
    }
    // For later round winners
    else if (node.gameUUID && gameWinners[node.gameUUID]) {
      const winner = gameWinners[node.gameUUID];
      const winnerNode = node.left?.name === winner ? node.left : node.right;
      if (winnerNode?.seed && winnerNode?.name) {
        return `${winnerNode.seed}. ${nameTable[winnerNode.name] || winnerNode.name}`;
      }
    }
    return '';
  };

  return (
    <div className={styles.regionQuadrant}>
      <div className={styles.regionTitle}>{regionName}</div>
      <div className={styles.bracketStructure}>
        {levels.map(level => (
          <div key={level} className={styles.bracketRound}>
            {getNodesAtLevel(region[0], level, maxDepth - 1).map((node, index) => (
              <div key={index} className={styles.gamePair}>
                <div className={styles.gameSlot}>
                  {getDisplayText(node)}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

interface PrintableBracketProps {
  regions: Record<Regions, NodeType[]>;
  finalFourState: FinalFourState | null;
  nameTable: Record<string, string>;
  gameWinners: Record<string, string>;
}

const PrintableBracket: React.FC<PrintableBracketProps> = ({ regions, finalFourState, nameTable, gameWinners }) => {
  const regionNames = Object.keys(regions) as Regions[];

  return (
    <div className={styles.printContainer}>
      {regionNames.map((regionName: Regions) => (
        <PrintableRegion
          key={regionName}
          region={regions[regionName]}
          regionName={regionName}
          nameTable={nameTable}
          gameWinners={gameWinners}
        />
      ))}
      
      <div className={styles.finalFourContainer}>
        <div className={styles.finalFourTitle}>Final Four</div>
        <div className={styles.bracketStructure}>
          <div className={styles.bracketRound}>
            <div className={styles.gamePair}>
              <div className={styles.gameSlot}>
                {finalFourState?.semifinalA?.winnerName ? 
                  nameTable[finalFourState.semifinalA.winnerName] : ''}
              </div>
            </div>
            <div className={styles.gamePair}>
              <div className={styles.gameSlot}>
                {finalFourState?.semifinalB?.winnerName ? 
                  nameTable[finalFourState.semifinalB.winnerName] : ''}
              </div>
            </div>
          </div>
          <div className={styles.bracketRound}>
            <div className={styles.gamePair}>
              <div className={styles.gameSlot}>
                {finalFourState?.champion?.name ? 
                  nameTable[finalFourState.champion.name] : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableBracket; 