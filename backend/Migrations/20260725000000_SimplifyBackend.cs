using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Mirror.Server.Data;

#nullable disable

namespace Mirror.Server.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260725000000_SimplifyBackend")]
public sealed class SimplifyBackend : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // IF NOT EXISTS lets the migration adopt databases created by the earlier
        // EnsureCreated-based prototype without losing its shared note.
        migrationBuilder.Sql(
            """
            CREATE TABLE IF NOT EXISTS "Notes" (
                "Id" INTEGER NOT NULL CONSTRAINT "PK_Notes" PRIMARY KEY AUTOINCREMENT,
                "Text" TEXT NOT NULL,
                "UpdatedAt" TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS "MirrorPreferences" (
                "Id" INTEGER NOT NULL CONSTRAINT "PK_MirrorPreferences" PRIMARY KEY AUTOINCREMENT,
                "ActivePetId" TEXT NOT NULL,
                "UpdatedAt" TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS "PetNames" (
                "PetId" TEXT NOT NULL CONSTRAINT "PK_PetNames" PRIMARY KEY,
                "Name" TEXT NOT NULL,
                "UpdatedAt" TEXT NOT NULL
            );

            DROP TABLE IF EXISTS "Users";
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "PetNames");
        migrationBuilder.DropTable(name: "MirrorPreferences");
    }
}
