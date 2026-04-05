import type {
  StudentCodingExercise,
  StudentConsoleEntry,
  StudentCodingLanguage,
} from "./student-space.types";

const codingLanguages: StudentCodingLanguage[] = [
  {
    id: "python",
    label: "Python 3",
    runtime: "3.12.3",
    fileName: "solution.py",
    starterCode: `# Definition for a binary tree node.
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class Solution:
    def invertTree(self, root: TreeNode | None) -> TreeNode | None:
        if root is None:
            return None

        # TODO: swap the left and right children
        # TODO: recursively invert the two subtrees
        return root
`,
    runSummary: "3/3 sample tests completed with stable recursion depth.",
    submitSummary: "Accepted on hidden tests with competitive runtime for Python 3.",
  },
  {
    id: "typescript",
    label: "TypeScript",
    runtime: "Node 20",
    fileName: "solution.ts",
    starterCode: `class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;

  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function invertTree(root: TreeNode | null): TreeNode | null {
  if (root === null) {
    return null;
  }

  // TODO: swap the left and right children
  // TODO: recurse into both subtrees
  return root;
}
`,
    runSummary: "Type checks passed and sample assertions returned the expected tree.",
    submitSummary: "Submission validated with 100 percent of hidden cases in TypeScript.",
  },
  {
    id: "java",
    label: "Java 21",
    runtime: "JDK 21",
    fileName: "Solution.java",
    starterCode: `class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode() {}

    TreeNode(int val) {
        this.val = val;
    }

    TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}

class Solution {
    public TreeNode invertTree(TreeNode root) {
        if (root == null) {
            return null;
        }

        // TODO: swap left and right children
        // TODO: recurse on both branches
        return root;
    }
}
`,
    runSummary: "JVM warm-up finished and the recursive solution passed sample checks.",
    submitSummary: "Accepted with balanced memory usage on the Java runtime.",
  },
  {
    id: "cpp",
    label: "C++17",
    runtime: "GCC 13",
    fileName: "solution.cpp",
    starterCode: `/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 * };
 */
class Solution {
public:
    TreeNode* invertTree(TreeNode* root) {
        if (root == nullptr) {
            return nullptr;
        }

        // TODO: swap the left and right children
        // TODO: recurse on both branches
        return root;
    }
};
`,
    runSummary: "Compilation completed without warnings and all sample tests passed.",
    submitSummary: "Submission accepted with strong runtime efficiency in C++17.",
  },
];

export const studentCodeExercise: StudentCodingExercise = {
  title: "Inversion d un arbre binaire",
  difficulty: "Moyen",
  category: "Arbres binaires",
  description:
    "Etant donne la racine d un arbre binaire, inversez l arbre et retournez sa racine.",
  detail:
    "L objectif est d inverser chaque noeud de l arbre en echangeant les enfants gauche et droit. La solution attendue doit rester lisible, correcte et suffisamment performante pour la contrainte donnee.",
  diagramUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCKXXqJlPxtLN7ByuMv07Vbx_jy-xFVMePcXqWLO4_TIitO7cwRo64epfi0PykWhiBHKGd4OPf7TlZv-C8e6xG1K9LktGfruBKIKLjDnCp6to9j9lZQK56950o2t910bcYufDegi08lY4L6-_M_M-5MqQyhWSQPKdAjXaEoIOFAYUbEZcU9jx-xXgoNQ7_ahhuRit5ztSHfE8hZdUms1aat6IQnzNuaSeYgheJIF-u11t1UvYhzzQOUpjlYuMovPflmZFoeX7wETypn",
  diagramAlt: "Visualisation d un arbre binaire et de son inversion",
  diagramCaption: "Visualisation du processus d inversion des noeuds.",
  likes: "12.4k",
  dislikes: "432",
  lastAttempt: "Derniere tentative il y a 2 jours",
  timeLimit: "1000ms",
  memoryLimit: "128MB",
  acceptanceRate: "61.8%",
  submissions: "248k soumissions",
  tags: ["Recursion", "DFS", "Binary Tree"],
  examples: [
    {
      title: "Exemple 1",
      input: "root = [4,2,7,1,3,6,9]",
      output: "[4,7,2,9,6,3,1]",
      explanation: "Les enfants de chaque noeud sont echanges recursivement.",
    },
    {
      title: "Exemple 2",
      input: "root = [2,1,3]",
      output: "[2,3,1]",
      explanation: "L inversion du sous-arbre gauche et droit se fait en une passe.",
    },
    {
      title: "Exemple 3",
      input: "root = []",
      output: "[]",
      explanation: "Un arbre vide reste vide.",
    },
  ],
  constraints: [
    "Le nombre de noeuds est compris entre 0 et 100.",
    "-100 <= Node.val <= 100",
    "Le temps d execution maximum est de 1000ms.",
    "La memoire allouee ne doit pas depasser 128MB.",
  ],
  hints: [
    "Commencez par traiter le cas ou la racine est nulle.",
    "Chaque appel recursif peut inverser les enfants du noeud courant avant de descendre.",
    "Une variable temporaire ou un swap direct suffit pour echange gauche et droit.",
  ],
  tests: [
    {
      label: "Sample tree",
      status: "passed",
      detail: "Matches [4,7,2,9,6,3,1] on the canonical example.",
    },
    {
      label: "Single node",
      status: "passed",
      detail: "Returns the same node when no children are present.",
    },
    {
      label: "Deep recursion",
      status: "pending",
      detail: "Stress run with asymmetric branches and null leaves.",
    },
  ],
  languages: codingLanguages,
};

export const studentCodeConsoleBoot: StudentConsoleEntry[] = [
  { tone: "muted", message: "> Workspace ready. Select a language and run the sample tests." },
  { tone: "info", message: "Hint: this challenge is a clean fit for recursive depth-first traversal." },
];
