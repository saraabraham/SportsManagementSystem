using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaskManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskManagementFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "created_at",
                table: "tasks",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "customer",
                table: "tasks",
                type: "character varying(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "phone_no",
                table: "tasks",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "sport_played",
                table: "tasks",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "updated_at",
                table: "tasks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "updates",
                table: "tasks",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_tasks_customer",
                table: "tasks",
                column: "customer");

            migrationBuilder.CreateIndex(
                name: "IX_tasks_deadline",
                table: "tasks",
                column: "deadline");

            migrationBuilder.CreateIndex(
                name: "IX_tasks_sport_played",
                table: "tasks",
                column: "sport_played");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_tasks_customer",
                table: "tasks");

            migrationBuilder.DropIndex(
                name: "IX_tasks_deadline",
                table: "tasks");

            migrationBuilder.DropIndex(
                name: "IX_tasks_sport_played",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "created_at",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "customer",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "phone_no",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "sport_played",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "updated_at",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "updates",
                table: "tasks");
        }
    }
}
