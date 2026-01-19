import { Column, DBTable, QueryResult } from "../types/database_type";

export const parseValue = (val: string) => {
  val = val.trim();
  if (val === "null" || val === "NULL") return null;
  if (
    (val.startsWith("'") && val.endsWith("'")) ||
    (val.startsWith('"') && val.endsWith('"'))
  )
    return val.slice(1, -1);
  if (val.toLowerCase() === "true") return true;
  if (val.toLowerCase() === "false") return false;
  if (!isNaN(Number(val))) return Number(val);
  return val;
};

export const compareValues = (rowVal: any, operator: string, queryVal: any) => {
  if (operator.toUpperCase() === "LIKE") {
    const strRow = String(rowVal).toLowerCase();
    const strQuery = String(queryVal).toLowerCase().replace(/%/g, "");
    return strRow.includes(strQuery);
  }
  switch (operator) {
    case "=":
      return rowVal == queryVal;
    case "!=":
    case "<>":
      return rowVal != queryVal;
    case ">":
      return rowVal > queryVal;
    case "<":
      return rowVal < queryVal;
    case ">=":
      return rowVal >= queryVal;
    case "<=":
      return rowVal <= queryVal;
    default:
      return false;
  }
};

export const checkWhereClause = (row: any, whereClause?: string) => {
  if (!whereClause) return true;
  const conditions = whereClause.split(/\s+and\s+/i);
  return conditions.every((cond) => {
    const match = cond
      .trim()
      .match(/^([a-zA-Z0-9_]+)\s*(=|!=|<>|>|<|>=|<=|like)\s*(.+)$/i);
    if (!match) return true;
    const col = match[1].trim();
    const op = match[2].trim();
    const val = parseValue(match[3].trim());
    return compareValues(row[col], op, val);
  });
};

export const executeQuery = (query: string, tables: DBTable[]): QueryResult => {
  try {
    const q = query.replace(/\n/g, " ").trim().replace(/;$/, "").trim();
    const lowerQ = q.toLowerCase();

    // 1. SELECT
    if (lowerQ.startsWith("select")) {
      const selectRegex =
        /^select\s+(.+?)\s+from\s+([a-z0-9_]+)(?:\s+where\s+(.+?))?(?:\s+order\s+by\s+(.+?))?(?:\s+limit\s+(\d+))?$/i;
      const match = q.match(selectRegex);
      if (!match)
        return {
          success: false,
          msg: "Syntax Error. Format: SELECT... FROM... [WHERE...] [ORDER BY...] [LIMIT...]",
        };

      const [_, colsStr, tableName, whereClause, orderClause, limitClause] =
        match;
      const table = tables.find(
        (t) => t.name.toLowerCase() === tableName.toLowerCase(),
      );
      if (!table)
        return { success: false, msg: `Table '${tableName}' not found.` };

      let resultRows = table.rows.filter((row) =>
        checkWhereClause(row, whereClause),
      );

      if (orderClause) {
        const [orderCol, orderDir] = orderClause.trim().split(/\s+/);
        const isDesc = orderDir && orderDir.toLowerCase() === "desc";
        resultRows.sort((a, b) => {
          if (a[orderCol] < b[orderCol]) return isDesc ? 1 : -1;
          if (a[orderCol] > b[orderCol]) return isDesc ? -1 : 1;
          return 0;
        });
      }

      if (limitClause) resultRows = resultRows.slice(0, Number(limitClause));

      if (colsStr.trim() !== "*") {
        const reqCols = colsStr.split(",").map((c) => c.trim());
        const invalid = reqCols.find(
          (c) => !table.columns.some((tc) => tc.name === c),
        );
        if (invalid)
          return { success: false, msg: `Column '${invalid}' not found.` };
        resultRows = resultRows.map((row) => {
          const newRow: any = {};
          reqCols.forEach((c) => (newRow[c] = row[c]));
          return newRow;
        });
      }
      return {
        success: true,
        data: resultRows,
        msg: `Fetched ${resultRows.length} rows.`,
      };
    }

    // 2. INSERT
    if (lowerQ.startsWith("insert into")) {
      const insertRegex =
        /^insert\s+into\s+([a-z0-9_]+)\s*\((.+?)\)\s*values\s*\((.+?)\)$/i;
      const match = q.match(insertRegex);
      if (!match)
        return {
          success: false,
          msg: "Syntax Error: INSERT INTO table (c1, c2) VALUES (v1, v2)",
        };

      const [_, tableName, colsStr, valsStr] = match;
      const table = tables.find(
        (t) => t.name.toLowerCase() === tableName.toLowerCase(),
      );
      if (!table)
        return { success: false, msg: `Table '${tableName}' not found.` };

      const cols = colsStr.split(",").map((c) => c.trim());
      const vals = valsStr.split(",").map((v) => parseValue(v));

      if (cols.length !== vals.length)
        return {
          success: false,
          msg: "Column count doesn't match value count.",
        };

      const newRow: any = {};
      cols.forEach((col, idx) => (newRow[col] = vals[idx]));

      const idCol = table.columns.find(
        (c) => c.name === "id" && c.type === "number",
      );
      if (idCol && !newRow.id) {
        const maxId = table.rows.reduce(
          (max, r) => (Number(r.id) > max ? Number(r.id) : max),
          0,
        );
        newRow.id = maxId + 1;
      }

      const updatedTable = { ...table, rows: [...table.rows, newRow] };
      const newTables = tables.map((t) =>
        t.id === table.id ? updatedTable : t,
      );
      return { success: true, msg: "Inserted 1 row.", newTables };
    }

    // 3. DELETE
    if (lowerQ.startsWith("delete from")) {
      const deleteRegex =
        /^delete\s+from\s+([a-z0-9_]+)(?:\s+where\s+(.+?))?$/i;
      const match = q.match(deleteRegex);
      if (!match)
        return {
          success: false,
          msg: "Syntax Error: DELETE FROM table [WHERE condition]",
        };

      const [_, tableName, whereClause] = match;
      const table = tables.find(
        (t) => t.name.toLowerCase() === tableName.toLowerCase(),
      );
      if (!table)
        return { success: false, msg: `Table '${tableName}' not found.` };

      const initialLen = table.rows.length;
      const newRows = table.rows.filter(
        (row) => !checkWhereClause(row, whereClause),
      );
      const deleted = initialLen - newRows.length;

      const updatedTable = { ...table, rows: newRows };
      const newTables = tables.map((t) =>
        t.id === table.id ? updatedTable : t,
      );
      return { success: true, msg: `Deleted ${deleted} rows.`, newTables };
    }

    // 4. UPDATE
    if (lowerQ.startsWith("update")) {
      const updateRegex =
        /^update\s+([a-z0-9_]+)\s+set\s+(.+?)(?:\s+where\s+(.+?))?$/i;
      const match = q.match(updateRegex);
      if (!match)
        return {
          success: false,
          msg: "Syntax Error: UPDATE table SET col=val [WHERE condition]",
        };

      const [_, tableName, setClause, whereClause] = match;
      const table = tables.find(
        (t) => t.name.toLowerCase() === tableName.toLowerCase(),
      );
      if (!table)
        return { success: false, msg: `Table '${tableName}' not found.` };

      const assignments = setClause.split(",").map((assign) => {
        const [c, v] = assign.split("=");
        return { col: c.trim(), val: parseValue(v.trim()) };
      });

      let updatedCount = 0;
      const newRows = table.rows.map((row) => {
        if (checkWhereClause(row, whereClause)) {
          updatedCount++;
          const newRow = { ...row };
          assignments.forEach((a) => (newRow[a.col] = a.val));
          return newRow;
        }
        return row;
      });

      const updatedTable = { ...table, rows: newRows };
      const newTables = tables.map((t) =>
        t.id === table.id ? updatedTable : t,
      );
      return { success: true, msg: `Updated ${updatedCount} rows.`, newTables };
    }

    // 5. DROP
    if (lowerQ.startsWith("drop table")) {
      const match = q.match(/^drop\s+table\s+([a-zA-Z0-9_]+)$/i);
      if (!match)
        return { success: false, msg: "Syntax Error: DROP TABLE table_name" };
      const tableName = match[1].trim();
      const newTables = tables.filter(
        (t) => t.name.toLowerCase() !== tableName.toLowerCase(),
      );
      if (newTables.length === tables.length)
        return { success: false, msg: `Table '${tableName}' not found.` };
      return { success: true, msg: `Table '${tableName}' dropped.`, newTables };
    }

    return { success: false, msg: "Unsupported command or Syntax Error." };
  } catch (e: any) {
    return { success: false, msg: "Execution Error: " + e.message };
  }
};

export const generateValueForColumn = (col: Column, rowId: number) => {
  if (col.isPrimary && col.type === "number") return rowId;
  if (col.type === "boolean") return Math.random() > 0.5;
  if (col.type === "date") return new Date().toISOString().split("T")[0];
  if (col.type === "number") return Math.floor(Math.random() * 100);
  const names = ["Apple", "Samsung", "Dell", "Sony", "LG", "HP"];
  if (col.name.includes("name"))
    return names[Math.floor(Math.random() * names.length)] + " " + rowId;
  return `Data ${rowId}`;
};
