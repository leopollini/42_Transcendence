# BetterPG.rb

require 'pg'

module BetterPG
  class EmptyNameRequest < StandardError
    def initialize(msg="Empty table name requested")
      super msg
    end
  end
  class RiskOfFullDeletion < StandardError
    def initialize(msg="Risk of deleting all tables. Table name contains wildcard")
      super msg
    end
  end
  
  class SimplePG
    def initialize(name = "")
      name ||= ""
      @pg = PG.connect("host=172.19.0.2 port=5432 password=pwd_postgres user=databaser")
      @name = name
      @columns = []
      puts "Succesfully connected to database."

      checkoutTable name if name
      createTable if name
    end
    
    def updateColumns()
      @columns = []
      begin
        (exec "SELECT * FROM", @name, "LIMIT 1")[0].each do |key, val|
          @columns.append key
        end
      rescue PG::UndefinedTable, IndexError => r
        puts "failel"
        return []
      end
      return @columns
    end
    def getColumns()
      return @columns
    end

    def checkoutTable(newname = "")                         # change target table
      newname ||= ""
      if newname == ""
        raise EmptyNameRequest
      end
      @name = newname
      createTable
      updateColumns
    end

    def createTable(columns=[], rewrite=false)               # returns true if creation was succesful, false if table already exists. Ensires requested columns are created if not present
      if rewrite
        puts "overwriting table " + @name
        dropTable
      end
      begin
        exec "CREATE TABLE ", @name, " (", columns.join(", "), ");"
      rescue PG::DuplicateTable => r
        addColumns *columns
        return false
      end
      return true
    end

    def addColumns(*columns)                                # add columns to current table
      columns.each do |c|
        begin
          exec "ALTER TABLE ", @name, " ADD ", c
        rescue => r
          puts r
        end
      end
      if columns.size != 0
        updateColumns
      end
    end

    
    def select(cols=[], keys=[], fullkeys=[])               # perform select for data fetching
      cols = updateColumns if cols == []
      req = []
      begin
        req = ["SELECT", cols.join(", "), "FROM", @name]
        keys.each_with_index do |k, i|
          req.append "WHERE " + cols[i] + "=" + k if k
        end
        fullkeys.each do |k|
          req.append "WHERE " + k
        end
        res = exec req
        return res if res[0]
      rescue PG::UndefinedColumn, IndexError => r
        puts r
        return [{}]
      end
    end

    def addValues(vals=[], format=[])
      exec "INSERT INTO", @name, (format.size != 0 ? "(" + format.join(", ") + ")" : ""), "VALUES", '(', vals.join(", "), ')'
    end
    
    def dropColumns(*columns)                               # drop column from current table
      columns.each do |c|
        begin
          exec "ALTER TABLE", @name, "DROP COLUMN", c
        rescue => r
          puts r
        end
      end
      if columns.size != 0
        updateColumns
      end
    end
    def dropTable(iamsure = false)
      if @name.include?('*') && !iamsure
        raise RiskOfFullDeletion
      end
      exec "DROP TABLE", @name
    end

    def exec(*strs)
      if strs.size != 0
        return @pg.exec(strs.join(' '))
      else
        return [{}]
      end
    end
  end
end
