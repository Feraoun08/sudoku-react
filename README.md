sudoku game based off the leet code problems number 36 and 37 distrubted into a react project with all the essential intallation 
Valid Sudoku :




class Solution(object):
    def isValidSudoku(self, board):
        rows = [set() for _ in range(9)]
        cols = [set() for _ in range(9)]
        boxes = [set() for _ in range(9)]

        for r in range(9):
            for c in range(9):

                if board[r][c] == ".":
                    continue

                num = board[r][c]

                # Which 3x3 box?
                box = (r // 3) * 3 + (c // 3)

                if num in rows[r] or num in cols[c] or num in boxes[box]:
                    return False

                rows[r].add(num)
                cols[c].add(num)
                boxes[box].add(num)

        return True


solving sudoku :  





class Solution(object):
    def solveSudoku(self, board):

        def isValid(row, col, num):

            
            for c in range(9):
                if board[row][c] == num:
                    return False

            
            for r in range(9):
                if board[r][col] == num:
                    return False

            
            boxRow = (row // 3) * 3
            boxCol = (col // 3) * 3

            for r in range(boxRow, boxRow + 3):
                for c in range(boxCol, boxCol + 3):
                    if board[r][c] == num:
                        return False

            return True

        def backtrack():

           
            for row in range(9):
                for col in range(9):

                    if board[row][col] == ".":

                        
                        for num in "123456789":

                            if isValid(row, col, num):

                               
                                board[row][col] = num

                                
                                if backtrack():
                                    return True

                                
                                board[row][col] = "."

                        
                        return False

            
            return True

        backtrack()


