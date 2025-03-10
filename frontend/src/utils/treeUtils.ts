import { NodeType } from './Types';

/**
 * Gets all nodes at a specific level in the tree
 * @param node The root node to start from
 * @param level The target level to get nodes from (1-based)
 * @param current The current level we're at (should match total levels initially)
 * @returns Array of nodes at the specified level
 */
export const getNodesAtLevel = (node: NodeType | null, level: number, current: number): NodeType[] => {
    if (!node) return [];
    if (current === level) return [node];
    if (!node.left || !node.right) return [];
    return [
        ...getNodesAtLevel(node.left, level, current - 1),
        ...getNodesAtLevel(node.right, level, current - 1),
    ];
};

/**
 * Calculate the total number of levels in a tree
 * @param node The root node to calculate levels for
 * @returns The total number of levels in the tree
 */
export const totalLevels = (node: NodeType | null): number => {
    if (!node || !node.left || !node.right || !node.gameUUID) return 0;
    return 1 + Math.max(totalLevels(node.left), totalLevels(node.right));
}; 